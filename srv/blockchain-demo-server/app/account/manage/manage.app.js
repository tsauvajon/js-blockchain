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
    wf.httpUtil.dataSuccess(req, res, req.url + " ok", { id: addr.id, password: addr.password }, conf.init.version);
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
    if (!req.param.target) {
      return wf.httpUtil.dataError(req, res, 'Error', 'req.param.target is required', 500, '1.0')
    }

    if (!global.VERIFY_ADDRESS(req.param.target)) {
      return wf.httpUtil.dataError(req, res, 'Error', 'req.param.target is not a valid address', 500, '1.0')
    }

    let result

    global.CHECK_ADDRESS(req.param.target, (err, ok) => {
      if (err) {
        result = wf.httpUtil.dataError(req, res, 'Error', err, 500, '1.0')
      }
      result = wf.httpUtil.dataSuccess(req, res, req.url + " ok", _data, conf.init.version)
    })

    return result
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
