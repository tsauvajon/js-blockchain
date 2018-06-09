/**
* @module SEAL/SIGN
*/

var wf = WF();

/**
*
* @function signBlock
* @desc Prototype principal de l'app sign
*
*/
function signBlock(conf)
{

  var route = "/sign/:action?/:target?/:address?";
  var router = function(req, res)
  {
    switch(req.param.action)
    {
      case "todo":
        blockToDo(req, res);
      break;
      case "difficulty":
        blockDifficulty(req, res);
      break;
      case "pow":
        POW(req, res);
      break;
      case "list":
      default:
        wf.httpUtil.dataSuccess(req, res, req.url + " ok", ["todo", "difficulty", "pow", "list"], conf.init.version);
      break;
    }
  }
  wf.Router.ANY("*", route, router);

  /**
  *
  * @function blockDifficulty
  * @param {object} req request parametre
  * @param {object} res response parametre
  * @desc Répond en API REST la difficulté en cours
  *
  */
  function blockDifficulty(req, res)
  {
    wf.httpUtil.dataSuccess(req, res, req.url + " ok", BLOCK_DIFFICULTY, conf.init.version);
  }

  /**
  *
  * @function blockToDo
  * @param {object} req request parametre
  * @param {object} res response parametre
  * @desc Répond en API REST la liste des blocks à signer
  *
  */
  function blockToDo(req, res)
  {
    function listBlock(err, files)
    {
      if(err)
      {
        wf.httpUtil.dataError(req, res, "Error", err.message, 500, "1.0");
      }
      else
      {
        var _todo = [];
        var firstBlock = FIRST_BLOCK + BLOCK_END;
        if(files.indexOf(firstBlock) < 0)
        {
          wf.httpUtil.dataError(req, res, "Error", "First block doesn't exist", 500, "1.0");
        }
        else
        {
          var _TMP;
          var _index = FIRST_BLOCK;
          var _reading = _index + BLOCK_END;
          recursiveRead();

          function endCheck()
          {
            wf.httpUtil.dataSuccess(req, res, req.url + " ok", _todo, conf.init.version);
          }

          function recursiveRead()
          {
            fs.readFile(path.join(BLOCK_STORE, _reading), function(err, result)
            {
              if(err)
              {
                wf.httpUtil.dataError(req, res, "Error", err.message, 500, "1.0");
                return;
              }
              else
              {
                try
                {
                  _TMP = JSON.parse(result);

                  if(_TMP.content.open == false && _TMP.sealed == false)
                  {
                    _todo.push(_TMP.content.current)
                  }
                  if(_TMP.content.next > 0)
                  {
                    _reading = _TMP.content.next + BLOCK_END;
                    recursiveRead();
                    return;
                  }
                  else
                  {
                    endCheck();
                    return;
                  }
                }catch(e)
                {
                  wf.httpUtil.dataError(req, res, "Error", e.message, 500, "1.0");
                  return;
                }
              }
            });
          }
        }
      }
    }

    getBlockList(listBlock);
  }

  /**
  *
  * @function storePOWinNext
  * @param {int} _block l'id du block dans lequel stocker le hash du bloc précédent
  * @param {string} _hash le hash à stocker
  * @param {string} _junk le junk à stocker
  * @desc Stocke la signature d'un block dans le block suivant
  *
  */
  function storePOWinNext(_block, _hash, _junk)
  {
    GET_BLOCK(_block, function(err, block)
    {
      if(err)
      {
        console.error("Could not get block : " + _block);
      }
      else
      {
        if(CURRENT_BLOCK.data.content.current == _block)
        {
          CURRENT_BLOCK.data.content.phash = _hash;
          CURRENT_BLOCK.data.content.pjunk = _junk;
          FLUSH_BLOCK();
          if(wf.CONF.DEBUG) console.log("[+] Added last signature in next block : " + _block);
        }
        else
        {
          block.content.phash = _hash;
          block.content.pjunk = _junk;
          SAVE_BLOCK(block, function(_err, _result)
          {
            if(_err)
            {
              console.error("Unexpected error : " + _err.message);
            }
            else
            {
              if(wf.CONF.DEBUG) console.log("[+] Added last signature in next block : " + _block);
            }
          });
        }
      }
    });
  }

  /**
  *
  * @function POW
  * @param {object} req request parametre
  * @param {object} res response parametre
  * @desc Récupère en POST les informations de signature, et valide la signature ou non
  *
  */
  function POW(req, res)
  {
    var _block = req.post.block;
    var _junk = req.post.junk;
    var _hash = req.post.hash;
    var _address = req.post.address

    if(_block == undefined) { wf.httpUtil.dataError(req, res, "Error", "Missing block", 500, "1.0"); return; }
    if(!_junk || _junk == undefined) { _junk = ""; }
    if(!_hash) { wf.httpUtil.dataError(req, res, "Error", "Missing hash", 500, "1.0"); return; }

    if(wf.CONF.MINING_REWARD && !_address)
    {
      wf.httpUtil.dataError(req, res, "Error", "Missing adress for reward", 500, "1.0");
      return;
    }
    else if(wf.CONF.MINING_REWARD && _address)
    {
      CHECK_ADDRESS(_address, function(err, _result)
      {
        if(err)
        {
          wf.httpUtil.dataError(req, res, "Error", err.message, 500, "1.0");
          return;
        }
        else
        {
          if(_result.exists == false)
          {
            wf.httpUtil.dataError(req, res, "Error", "Reward address doesn't exist", 500, "1.0");
            return;
          }
          else
          {
            cbGetBlock();
          }
        }
      });
    }
    else
    {
      cbGetBlock();
    }

    function cbGetBlock()
    {
      GET_BLOCK(_block, function(err, block)
      {
        if(err)
        {
          wf.httpUtil.dataError(req, res, "Error", err.message, 500, "1.0");
        }
        else
        {
          if(!block.open && block.sealed)
          {
            wf.httpUtil.dataError(req, res, "Error", "This block is sealed", 500, "1.0");
            return;
          }
          try
          {
            var _content = JSON.stringify(block.content);
            _content += _junk;
            var _result = wf.Crypto.createSHA256(_content);
            if(_result == _hash)
            {
              var _difficulty = 15 - BLOCK_DIFFICULTY;
              for(var _c in _hash)
              {
                _tmp = parseInt(_hash[_c], 16);
                if(_tmp > _difficulty)
                {
                  // BAD HASH
                  wf.httpUtil.dataError(req, res, "Error", "Bad hash, difficulty not respected", 500, "1.0");
                  return;
                }
              }
              // GOOD
              block.junk = _junk;
              block.hash = _hash;
              block.sealed = true;
              SAVE_BLOCK(block, function(_err, _result)
              {
                if(_err)
                {
                  wf.httpUtil.dataError(req, res, "Error", "Unexpected error : " + _err.message, 500, "1.0");
                }
                else
                {
                  storePOWinNext(_block + 1, _hash, _junk);
                  if(wf.CONF.DEBUG) console.log("[+] Block correctly signed : " + block.content.current);
                  if(wf.CONF.MINING_REWARD)
                  {
                    var _transact = doTransaction(-1, _address, wf.CONF.REWARD_AMOUNT, "r");
                    CURRENT_BLOCK.data.content.register.push(_transact);
  							    FLUSH_BLOCK();

                    if(wf.CONF.DEBUG) console.log("[+] Added reward of " + wf.CONF.REWARD_AMOUNT + " to adress " + _address);
                  }
                  wf.httpUtil.dataSuccess(req, res, req.url + " ok", "Valid hash", conf.init.version);
                }
              });

            }
            else
            {
              wf.httpUtil.dataError(req, res, "Error", "Bad hash", 500, "1.0");
              return;
            }
          }
          catch(e)
          {
            wf.httpUtil.dataError(req, res, "Error", e.message, 500, "1.0");
          }
        }
      });
    }
  }
}
module.exports = signBlock;
