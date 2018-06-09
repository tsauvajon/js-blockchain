/**
 * @namespace ETAPE2
 */

/**
* @module ACCOUNT/MANAGE
*/

var wf = WF();

/**
*
* @function manageAccount
* @desc Prototype principal de l'app manage
*
*/
function manageAccount(conf)
{

  /**
  *
  * @memberof ETAPE2
  * @function createAccount
  * @param {object} req request parametre
  * @param {object} res response parametre
  * @desc Crée un compte et le renvoie avec la fonction
  * wf.httpUtil.dataSuccess(req, res, info, data, version);
  * @todo créer la fonction et la valider avec ./fortressjs --test create
  *
  */

  this.createAccount = function(req, res)
  {
    NEXT_BLOCK(); // vérifie qu'un autre block ne doit pas être créé

    const addr = global.CREATE_ADDRESS()
    const tx = global.doTransaction(-1, addr.id, global.START_TOKEN, 'n')
    CURRENT_BLOCK.data.content.register.push(tx)
    wf.httpUtil.dataSuccess(req, res, req.url + " ok", { id: addr.id }, conf.init.version);

    /*
      TODO :
      utiliser la fonction CREATE_ADDRESS() pour générer une address
      utiliser doTransaction(-1, account id, "n") pour générer une transaction de type nouvelle adresse
      pousser la transaction dans CURRENT_BLOCK.data.content.regiser avec la fonction push
      réponder à la requète l'adresse avec la fonction :
      wf.httpUtil.dataSuccess(req, res, req.url + " ok", {id: "id de l'adresse"}, conf.init.version);
      cette fonction est une procédure qui ne retourne rien
    */


  }

  /**
  *
  * @memberof ETAPE2
  * @function getBalance
  * @param req request parametre
  * @param res response parametre
  * @desc Récupère la balance d'un compte et la renvoie avec
  * wf.httpUtil.dataSuccess(req, res, info, data, version);
  * @todo créer la fonction et la valider avec ./fortressjs --test balance
  *
  */

  this.getBalance = function(req, res)
  {
    /*
      TODO :
      vérifier que req.param.target est présent, sinon envoyer une erreur avec la fonction :
        wf.httpUtil.dataError(req, res, "Error", "MESSAGE DE L'ERREUR", 500, "1.0");

      si req.param.target est présent, vérifier que c'est une adresse valide avec CHECK_ADDRESS

      s'il y a une erreur ou que l'adresse n'existe pas, renvoyer une erreur avec wf.httpUtil.dataError
      sinon, renvoyer le résulte _data du callback de CHECK_ADDRESS avec :
        wf.httpUtil.dataSuccess(req, res, req.url + " ok", _data, conf.init.version);
    */

  }

  var route = "/account/:action?/:target?";
  var router = function(req, res)
  {
    switch(req.param.action)
    {
      case "create":
        this.createAccount(req, res);
      break;
      case "balance":
        this.getBalance(req, res);
      break;
      case "list":
      default:
        wf.httpUtil.dataSuccess(req, res, req.url + " ok", ["create", "balance", "list"], conf.init.version);
      break;
    }
  }.bind(this);
  wf.Router.ANY("*", route, router);

}
module.exports = manageAccount;
