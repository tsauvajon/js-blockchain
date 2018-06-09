/**
  * @namespace ETAPE1
*/

/**
* @module INIT/START
*/

// CREER FICHIERS DE TEST PAR ETAPE

var wf = WF();

/* DECLARATION DES VARIABLES GLOBALES */
global.BLOCK;
global.DATA_STORE = path.join(wf.CONF.BLOCKCHAIN_STORE, "blockchain");
global.BLOCK_STORE = path.join(DATA_STORE, "block") + "/";
global.BLOCK_CONF = path.join(DATA_STORE, "blockchain.ini");
global.BLOCK_END = ".block";
global.MAX_TRANSACTION = wf.CONF.MAX_TRANSACTION;
global.FIRST_BLOCK = 0;
global.START_TOKEN = wf.CONF.START_TOKEN;
global.PROTOCOL = wf.CONF.PROTOCOL;
global.INIT_ADDRESS = wf.CONF.INIT_ADDRESS;
global.BLOCK_DIFFICULTY = wf.CONF.BLOCK_DIFFICULTY;
global.FLUSH_TIME = wf.CONF.FLUSH_TIME;

/**
* @var CURRENT_BLOCK
* @desc Variable globale, contient l'état du block en cours dans loaded et son contenu dans data.
*/
global.CURRENT_BLOCK = {loaded: false, data:{}};
global.CURRENT_CONF;

/**
*
* @function startBlockchain
* @desc Initialise la blockchain, prototype principal de l'app start
*
*/
function startBlockchain()
{
  // Crée le dossier DATA_STORE s'il n'existe pas
  if(!fs.existsSync(DATA_STORE))
  {
    console.log("[*] Creating data store");
    fs.mkdirSync(DATA_STORE);
  }

  // Crée le dossier BLOCK_STORE s'il n'existe pas
  if(!fs.existsSync(BLOCK_STORE))
  {
    console.log("[*] Creating block store");
    fs.mkdirSync(BLOCK_STORE);
  }

  // Crée le fichier blockchain.ini s'il n'exite pas
  if(!fs.existsSync(BLOCK_CONF))
  {
    console.log("[*] Creating blockchain conf");
    fs.writeFileSync(BLOCK_CONF, JSON.stringify(INIT_CONF()));
  }

  console.log("[*] Loading current configuration");
  var _configuration = fs.readFileSync(BLOCK_CONF);
  CURRENT_CONF = JSON.parse(_configuration);

  var first = path.join(BLOCK_STORE, FIRST_BLOCK + BLOCK_END);

  // Crée le premier block s'il n'existe pas
  if(!fs.existsSync(first))
  {
    console.log("[*] Init First Block");
    var init = INIT_BLOCK(-1, 0);
    init.content.register.push(FIRST_TRANSACTION());
    fs.writeFileSync(first, JSON.stringify(init));
  }

  console.log("[*] Loading current block");
  var _current = fs.readFileSync(path.join(BLOCK_STORE, CURRENT_CONF.current + BLOCK_END));
  CURRENT_BLOCK.data = JSON.parse(_current);
  CURRENT_BLOCK.loaded = true;

  console.log("[*] Blockchain init ok");

}
module.exports = startBlockchain;


/*** FONCTIONS ***/


/**
*
* @memberof ETAPE1
* @function FIRST_TRANSACTION
* @desc Retourne une transaction forgée avec la fonction doTransaction(FROM, TO, AMOUNT)
* @todo créer la fonction et la valider avec ./fortressjs --test first
*
*/

global.FIRST_TRANSACTION = function()
{
  return global.doTransaction(-1, global.INIT_ADDRESS, global.START_TOKEN)
}

/**
*
* @memberof ETAPE1
* @function VERIFY_ADDRESS
* @param {string} _addr Adresse à tester
* @desc Teste si une adresse correspond au format Bx0000000000000000000000000000000000000000000000000000000000000000 et renvoit true ou false
* @return {bool}
* @todo créer la fonction et la valider avec ./fortressjs --test verify
*
*/

global.VERIFY_ADDRESS = function(_addr)
{
  if (!_addr) {
    return false
  }

  if (!typeof _addr === 'string') {
    return false
  }

  if (_addr.toString().substr(0, 2) !== global.PROTOCOL) {
    return false
  }

  if (_addr.length !== global.INIT_ADDRESS.length) {
    return false
  }

  return true;
}

/**
*
* @function NEXT_BLOCK
* @desc Fonction globale, passe au bloc suivant
*
*/
global.NEXT_BLOCK = function()
{
  if(CURRENT_BLOCK.data.content.register.length > MAX_TRANSACTION - 1)
  {
    CURRENT_BLOCK.data.content.open = false;
    CURRENT_BLOCK.data.content.next = CURRENT_CONF.current+1;
    FLUSH_BLOCK();
    CURRENT_CONF.current++;
    FLUSH_CONFIG();
    CURRENT_BLOCK.data = INIT_BLOCK(CURRENT_CONF.current-1, CURRENT_CONF.current);
    FLUSH_BLOCK();
  }
}


/**
*
* @function CHECK_ADDRESS
* @param {string} _addr Adresse à tester
* @param {callback} cb Callback appelé à la fin de la fonction, de la forme cb(err, data)
* @desc Teste si une adresse existe dans la blockchain
*
*/
global.CHECK_ADDRESS = function(_addr, cb)
{
  if(!VERIFY_ADDRESS(_addr))
  {
    cb({ code: 404, message: "Bad address" }, null);
  }
  else
  {
    var checkAddr = function(err, files)
    {
      if(err)
      {
        cb(err);
      }
      else
      {
        var firstBlock = FIRST_BLOCK + BLOCK_END;
        if(files.indexOf(firstBlock) < 0)
        {
          cb({code:500, message:"First block doesn't exist"});
        }
        else
        {
          var _TMP;
          var _addr_exists = false;
          var _balance = 0;
          var _index = FIRST_BLOCK;
          var _reading = _index + BLOCK_END;
          recursiveRead();

          function endCheck()
          {
              cb(null, {exists: _addr_exists, balance: _balance});
          }

          function recursiveRead()
          {
            fs.readFile(path.join(BLOCK_STORE, _reading), "utf8", function(err, result)
            {
              if(err)
              {
                cb(err);
                return;
              }
              else
              {
                try
                {
                  _TMP = JSON.parse(result);

                  for(var i in _TMP.content.register)
                  {
                      var _transact = _TMP.content.register[i];
                      if(_transact.type == "t" || _transact.type == "n"  || _transact.type == "r")
                      {
                        if(_transact.from == _addr)
                        {
                          if(!_addr_exists) _addr_exists = true;
                          _balance -= _transact.amount;
                        }
                        else if(_transact.to == _addr)
                        {
                          if(!_addr_exists) _addr_exists = true;
                          _balance += _transact.amount;
                        }
                      }
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
                  cb(e);
                  return;
                }
              }
            });
          }
        }
      }
    }
    getBlockList(checkAddr);
  }
}

/**
*
* @function getBlockList
* @param {function} cb callback appelé lorsque la fonction est terminé
* @desc Fonction globale, retourne la liste des blocks dans un callback de la forme cb(error, files[])
*
*/
global.getBlockList = function(cb)
{
  fs.readdir(BLOCK_STORE, function(err, files)
  {
    cb(err, files);
  });
}

/**
*
* @function FLUSH_BLOCK
* @desc Fonction globale, enregistre le bloc en cours
*
*/
global.FLUSH_BLOCK = function()
{
  try
  {
    fs.writeFileSync(path.join(BLOCK_STORE, CURRENT_CONF.current + BLOCK_END), JSON.stringify(CURRENT_BLOCK.data));
    if(wf.CONF.DEBUG)
    {
      console.log("[*] Flushed block : " + CURRENT_CONF.current + " | register : " + CURRENT_BLOCK.data.content.register.length);
    }
  }
  catch(e)
  {
    console.log("[!] Error while flushing block : " + CURRENT_CONF.current + e.message);
  }
}

/**
*
* @function FLUSH_CONFIG
* @desc Fonction globale, enregistre la configuration en cours
*
*/
global.FLUSH_CONFIG = function()
{
  try
  {
    fs.writeFileSync(BLOCK_CONF, JSON.stringify(CURRENT_CONF));
  }
  catch(e)
  {
    if(wf.CONF.DEBUG)
    {
      console.log("[*] Flushed conf : " + JSON.stringify(CURRENT_CONF));
    }
  }
}

/**
*
* @function INIT_CONF
* @desc Fonction globale, initialise le fichier de configuration blockchain.ini
*
*/
global.INIT_CONF = function()
{
  var _conf =
  {
    current: FIRST_BLOCK,
  }
  return _conf;
}

/**
*
* @function INIT_BLOCK
* @param {int} _previous l'id du block précédent
* @param {int} _current l'id du block en cours
* @desc Fonction globale, initialise le premier bloc
*
*/
global.INIT_BLOCK = function(_previous, _current)
{
  var initBloc =
  {
    sealed:false,
    hash:"",
    junk: "",
    content:
    {
      open:true,
      date: Date.now(),
      previous: _previous,
      current: _current,
      next: -1,
      phash: "",
      pjunk: "",
      register: [],
    },
  };
  return initBloc;
}

/**
*
* @function CREATE_ADDRESS
* @desc Fonction globale, crée une adresse
*
*/
global.CREATE_ADDRESS = function()
{
  const password = wf.UID.generate() + Date.now()
  var _address =
  {
    id: PROTOCOL + wf.Crypto.createSHA256(password),
    password
  };
  return _address;
}

/**
*
* @function GET_BLOCK
* @param {int} _id l'id du block à récupérer
* @param {function} cb callback appelé lorsque la fonction est terminé
* @desc Fonction globale, récupère un bloc avec son id, appelle un callback de la forme cb(err, bloc)
*
*/
global.GET_BLOCK = function(_id, cb)
{
  fs.readFile(path.join(BLOCK_STORE, _id + BLOCK_END), "utf8", function(err, result)
  {
    if(err)
    {
      cb(err);
      return;
    }
    else
    {
      try
      {
        result = JSON.parse(result);
        cb(null, result);
        return;
      }
      catch (e)
      {
        cb(err);
        return;
      }
    }
  });
}

/**
*
* @function SAVE_BLOCK
* @param {int} _block l'id du block à sauvegarder
* @param {function} cb callback appelé lorsque la fonction est terminé
* @desc Fonction globale, sauvegarde un bloc, appelle un callback de la forme cb(err)
*
*/
global.SAVE_BLOCK = function(_block, cb)
{
  try
  {
    fs.writeFileSync(path.join(BLOCK_STORE, _block.content.current + BLOCK_END), JSON.stringify(_block));
    if(wf.CONF.DEBUG)
    {
      console.log("[*] Sealed block : " + _block.content.current + " | register : " +_block.content.register.length);
    }
    cb(null, {sealed:true});
  }
  catch(e)
  {
    if(wf.CONF.DEBUG)
    {
      console.log("[!] Error when saving block : " + _block.content.current + " - " + e.message);
    }
    cb(err);
  }
}

/**
*
* @function doTransaction
* @param {string} _from l'adresse qui envoie
* @param {string} _to l'adresse qui reçoit
* @param {int} _amount le montant de la transaction
* @param {string} _type le type de la transaction, par défaut "t"
* @desc Fonction globale, retourne un objet de type transaction
*
*/
global.doTransaction = function(_from, _to, _amount, _type, password)
{
  if (password && !wf.Crypto.createSHA256(password !== _from)) {
    throw new Error('Bad password')
  }

  if(!_type) _type = "t";
  var _transact =
  {
    type: _type,
    id: PROTOCOL + wf.Crypto.createSHA256(wf.UID.generate() + Date.now()),
    from:_from,
    to:_to,
    amount:_amount,
    date: Date.now(),
  }
  return _transact;
}

/**
* @var _sfb
* @desc Interval de déclenchement de la fonction FLUSH_BLOCK à l'interval FLUSH_TIME
*/
var _sfb = setInterval(FLUSH_BLOCK, FLUSH_TIME);

/**
* @var _sfc
* @desc Interval de déclenchement de la fonction FLUSH_CONFIG à l'interval FLUSH_TIME
*/
var _sfc = setInterval(FLUSH_CONFIG, FLUSH_TIME);
