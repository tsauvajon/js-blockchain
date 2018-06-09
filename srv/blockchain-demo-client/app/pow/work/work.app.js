/**
* @namespace ETAPE4
*/

/**
* @module POW/WORK
*/

var wf = WF();

var BLOCK_DIFFICULTY = 0;
var WORKING = false;
var READY = false;
var DEBUG = wf.CONF.DEBUG;
var TODO = [];

function workPOW(conf)
{

  /**
  *
  * @memberof ETAPE4
  * @function calcHash
  * @param {string} _str le contenu du block en chaine de caractère à signer
  * @param {string} _difficulty la difficulté du block à signer
  * @desc retourn une erreur et arrête le flow d'éxécution si AUTHENTICITY.state == false
  * @return {string} Retourne la signature en chaine de caractère hexa calculée avec la fonction wf.Crypto.createSHA256(_string)
  * @todo créer la fonction et la valider avec ./fortressjs --test hash
  *
  */
  function calcHash(_str, _difficulty)
  {
    var DONE = false;
    var _dic = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var _junk = "";
    var result = {seal: "", junk:""};

    while(false) // remplace par DONE
    {
      /*
        TODO :
        _difficulty = 15 - BLOCK_DIFFICULTY

        Créer un junk random
        Utiliser les fonctions js string.charAt(index), Math.floor(integer) et wf.Crypto.createSHA256(string)
        Utiliser les boucles for(var i = 0; i  < integer; i++)
        Tester que chaque caractère du hash est suppérieur à _difficulty
        ex: si BLOCK_DIFFICULTY = 1 alors _difficulty = 14, donc si un caractère est  > 14, cad > e, donc == f, il n'est pas correct

        la fonction doit retourner un object comme : var _result = { seal: "string", junk: "string"};

      */

    }


  }

  /**
  *
  * @function checkDifficulty
  * @desc Récupère la difficulté depuis le serveur avec l'api /sign/difficulty, et stocke la difficulté dans la variable BLOCK_DIFFICULTY
  *
  */

  function checkDifficulty()
  {
    var getOption =
    {
      port: 9292,
      hostname: "localhost",
      method: "GET",
      path: "/sign/difficulty",
    }
    wf.httpUtil.httpGet(getOption,
    function(err)
    {
      READY = false;
    },
    function(data)
    {
      try
      {
        data = JSON.parse(data);
        BLOCK_DIFFICULTY = parseInt(data.data);
        READY = true;
        if(DEBUG) console.log("[+] Blocks difficulty : " + BLOCK_DIFFICULTY);
      }
      catch(e)
      {
        if(DEBUG) console.log("[!] Error : " + e.message);
        READY = false;
      }
    });
  }

  /**
  *
  * @function getBlockToSign
  * @desc Récupère la liste des blocs à signer depuis le serveur avec l'api /sign/todo, et la stocke dans TODO
  *
  */

  function getBlockToSign()
  {
    if(!READY) return;

    var getOption =
    {
      port: 9292,
      hostname: "localhost",
      method: "GET",
      path: "/sign/todo",
    }
    wf.httpUtil.httpGet(getOption,
    function(err)
    {
      READY = false;
    },
    function(data)
    {
      try
      {
        data = JSON.parse(data);
        TODO = data.data;
        if(!TODO) TODO = [];
        READY = true;
        if(DEBUG) console.log("[+] Blocks to sign : " + JSON.stringify(TODO));
      }
      catch(e)
      {
        if(DEBUG) console.log("[!] Error : " + e.message);
        READY = false;
      }
    });
  }

  /**
  *
  * @function sendSeal
  * @desc Envoit au serveur l'id d'un block, le junk et la signature, ainsi que l'adresse où verser la récompense
  *
  */
  function sendSeal(_id ,_junk, _hash, _address)
  {
    var _post = {block: _id, junk:_junk, hash:_hash, address:_address};
    var getOption =
    {
      port: 9292,
      hostname: "localhost",
      method: "POST",
      path: "/sign/pow/",
      data: JSON.stringify(_post),
    }

    wf.httpUtil.httpReq(getOption,
    function(err)
    {
      WORKING = false;
      if(DEBUG) console.log("[+] Error sending seal : " + err.message);
    },
    function(data)
    {
      WORKING = false;
      try
      {
        data = JSON.parse(data);
        if(data.code == 0)
        {
          if(DEBUG) console.log("[+] Blocks signed : " + _id);
          TODO.shift();
        }
        else
        {
          if(DEBUG) console.log("[!] Error : " + data.message);
        }
      }
      catch(e)
      {
        if(DEBUG) console.log("[!] Error : " + e.message);
      }
    });
  }

  /**
  *
  * @function doWork
  * @desc Si le mineur est prêt, et s'il n'est pas déjà en train de travailler, enclenche le processus de signature sur le premier bloc de TODO
  *
  */
  function doWork()
  {
    if(!READY) return;
    if(WORKING) return;
    WORKING = true;

    if(!TODO || TODO.length < 1)
    {
      WORKING = false;
      return;
    }

    var _working = TODO[0];

    console.log("[*] Signing block : " + _working);

    var getOption =
    {
      port: 9292,
      hostname: "localhost",
      method: "GET",
      path: "/block/get/" + _working,
    }
    wf.httpUtil.httpGet(getOption,
    function(err)
    {
      WORKING = false;
    },
    function(data)
    {
      if(DEBUG) console.log("[*] Searching hash for : " + _working);
      try
      {
        var _difficulty = 15 - BLOCK_DIFFICULTY;
        var block = JSON.parse(data).data;
        var _str = JSON.stringify(block.content);

        var _result = calcHash(_str, _difficulty);

        sendSeal(_working, _result.junk, _result.seal, wf.CONF.MY_ADDRESS);
        return;

      }
      catch(e)
      {
        console.dir(e);
        WORKING = false;
      }
    });
  }

  /**
  * @var _scd
  * @desc Interval de vérification de la difficulté
  */
  var _scd = setInterval(checkDifficulty, 1000 * 5);

  /**
  * @var _sgbts
  * @desc Interval de vérification des blocks à signer
  */
  var _sgbts = setInterval(getBlockToSign, 1000 * 5);

  /**
  * @var _sdw
  * @desc Interval de déclenchement du minage
  */
  var _sdw = setInterval(doWork, 1000 * 7);

  /**
  *
  * @function accessCalcHash
  * @desc Fonction accesseur pour calcHash
  *
  */
  this.accessCalcHash = calcHash;

}
module.exports = workPOW;
