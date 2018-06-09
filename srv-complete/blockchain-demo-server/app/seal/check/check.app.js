/**
* @namespace ETAPE3
*/

/**
* @module SEAL/CHECK
*/

var wf = WF();

/**
*
* @function Check
* @desc Prototype principal de l'app check
*
*/
function Check()
{

  /**
  * @var AUTHENTICITY
  * @desc Contient l'état de l'authenticité de la blockchain, avec l'état dans la clé state, et l'erreur dans la clé error
  */
  var AUTHENTICITY = { state: true, error: null};

  /**
  *
  * @memberof ETAPE3
  * @function authenticityFlow
  * @param {object} req request parametre
  * @param {object} res response parametre
  * @desc retourne une erreur et arrête le flow d'éxécution si AUTHENTICITY.state == false
  * @todo créer la fonction et la valider avec ./fortressjs --test etape3
  *
  */
  this.authenticityFlow = function(req, res)
  {
    if(!AUTHENTICITY.state)
    {
      req.continue = false;
      wf.httpUtil.dataError(req, res, "Error", AUTHENTICITY.error, 500, "1.0");
      return;
    }
  }

  /**
  *
  * @function checkBlocksInterval
  * @desc Fonction appelée par setInterval
  *
  */
  function checkBlocksInterval()
  {
    getBlockList(checkBlocks);
  }

  /**
  *
  * @function checkBlocks
  * @param {object} err erreur, null si pas d'erreur
  * @param {array} files liste des fichiers
  * @desc fonction passée en callback à getBlockList
  *
  */
  function checkBlocks(err, files)
  {
    var LAST = {hash:"", junk:"", id:-1};
    if(err)
    {
      if(wf.CONF.DEBUG)
      {
        console.log("[!] Authenticity error : " + err.message);
      }
      AUTHENTICITY = { state: false, error: err.message};
    }
    else
    {
      var firstBlock = FIRST_BLOCK + BLOCK_END;
      if(files.indexOf(firstBlock) < 0)
      {
        if(wf.CONF.DEBUG)
        {
          console.log("[!] Authenticity error : First block doesn't exist");
        }
        AUTHENTICITY = { state: false, error: "First block doesn't exist"};
      }
      else
      {
        var _TMP;
        var _index = FIRST_BLOCK;
        var _reading = _index + BLOCK_END;
        recursiveRead();

        function recursiveRead()
        {
          fs.readFile(path.join(BLOCK_STORE, _reading), function(err, result)
          {
            if(err)
            {
              if(wf.CONF.DEBUG)
              {
                console.log("[!] Authenticity error :" + err.message);
              }
              AUTHENTICITY = { state: false, error: err.message};
              return;
            }
            else
            {
              try
              {
                _TMP = JSON.parse(result);

                if(_TMP.sealed == true)
                {
                  if(_TMP.content.phash != LAST.hash || _TMP.content.pjunk != LAST.junk )
                  {
                    if(wf.CONF.DEBUG)
                    {
                      console.log("[!] Authenticity error : Signature is different for blocs : " + _TMP.content.current + " and " + LAST.id);
                    }
                    AUTHENTICITY = { state: false, error: "Signature is different for blocs : " + _TMP.content.current + " and " + LAST.id};
                    return;
                  }

                  var _test = JSON.stringify(_TMP.content);
                  _test += _TMP.junk;
                  var _testHash = wf.Crypto.createSHA256(_test);
                  if(_testHash != _TMP.hash)
                  {
                    if(wf.CONF.DEBUG)
                    {
                      console.log("[!] Authenticity error for bloc : " + _TMP.content.current);
                    }
                    AUTHENTICITY = { state: false, error: "Authenticity error for bloc : " + _TMP.content.current };
                    return;
                  }

                }
                if(_TMP.content.next > 0)
                {
                  _reading = _TMP.content.next + BLOCK_END;
                  LAST =
                  {
                    hash: _TMP.hash,
                    junk: _TMP.junk,
                    id: _TMP.content.current,
                  }
                  recursiveRead();
                  return;
                }
                else if(_TMP.content.current == CURRENT_CONF.current)
                {
                  if(wf.CONF.DEBUG)
                  {
                    console.log("[+] Authenticity verified");
                  }
                  AUTHENTICITY = { state: true, error: null};
                }
                else
                {
                  if(wf.CONF.DEBUG)
                  {
                    console.log("[!] Error : Current block in blockchain.ini is not the last block");
                  }
                  AUTHENTICITY = { state: false, error: "Current block in blockchain.ini is not the last block"};
                }
              }
              catch(e)
              {
                if(wf.CONF.DEBUG)
                {
                  console.log("[!] Authenticity error :" + e.message);
                }
                AUTHENTICITY = { state: false, error: e.message};
                return;
              }
            }
          });
        }
      }
    }
  }

  /**
  * @var _scbi
  * @desc Interval de déclenchement de la vérification des blocks
  */
  var _scbi = setInterval(checkBlocksInterval, wf.CONF.CHECK_TIME);
  checkBlocksInterval();

  /**
  * @var this.code
  * @desc Déclenché dans le flow d'éxécution à chaque requête arrivant au serveur
  */
  this.code = this.authenticityFlow;

  /**
  *
  * @function setAuthenticity
  * @desc Fonction accesseur pour AUTHENTICITY
  *
  */
  this.setAuthenticity = function(_authenticity)
  {
    AUTHENTICITY = _authenticity;
  }
}

module.exports = Check;
