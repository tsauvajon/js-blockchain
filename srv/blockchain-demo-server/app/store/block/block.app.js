/**
* @module STORE/BLOCK
*/

var wf = WF();

/**
*
* @function blockMagement
* @desc Prototype principal de l'app block
*
*/
function blockMagement(conf)
{
	var route = "/block/:action?/:target?";
	var router = function(req, res)
	{
			switch(req.param.action)
			{
				case "get":
					getBlock(req, res);
				break;
				case "add":
					addTransactionToBlock(req, res);
				break;
				case "inject":
					injectToken(req, res);
				break;
				case "list":
				default:
					wf.httpUtil.dataSuccess(req, res, req.url + " ok", ["get", "add", "list"], conf.init.version);
				break;
			}
	}

	wf.Router.ANY("*", route, router);

	/**
  *
  * @function getBlock
  * @param {object} req request parametre
  * @param {object} res response parametre
  * @desc Répond en API REST le contenu d'un block en fonction de l'id passée en url dans le champs target : /block/get/1
  *
  */
	function getBlock(req, res)
	{
		var _id;
		if(req.param.target == undefined) _id = CURRENT_CONF.current;
		else _id = parseInt(req.param.target);
		if(CURRENT_BLOCK && CURRENT_BLOCK.loaded && _id == CURRENT_BLOCK.data.content.current)
		{
			wf.httpUtil.dataSuccess(req, res, req.url + " ok", CURRENT_BLOCK.data, conf.init.version);
			return;
		};
		var _block = path.join(BLOCK_STORE, _id + BLOCK_END);
		fs.readFile(_block, "utf8", function(err, data)
		{
			if(err)
			{
				wf.httpUtil.dataError(req, res, "Error", err.message, 500, "1.0");
			}
			else
			{
				try
				{
					data = JSON.parse(data);
					wf.httpUtil.dataSuccess(req, res, req.url + " ok", data, conf.init.version);
				}
				catch(e)
				{
					wf.httpUtil.dataError(req, res, "Error", "Unexpected error", 500, "1.0");
				}
			}
		});
	}

	/**
  *
  * @function injectToken
  * @param {object} req request parametre
  * @param {object} res response parametre
  * @desc Injecte des tokens dans la blockchain en fonction de la quantité passée en url dans le champs target : /block/inject/100
  *
  */
	function injectToken(req, res)
	{
		if(!req.param.target)
		{
			wf.httpUtil.dataError(req, res, "Error", "Missing amount", 500, "1.0");
			return;
		}
		else
		{
			var amount = parseInt(req.param.target);
			if(amount > 0)
			{
				var _transact = doTransaction(-1, INIT_ADDRESS, amount);
				CURRENT_BLOCK.data.content.register.push(_transact);
				FLUSH_BLOCK();
				wf.httpUtil.dataSuccess(req, res, req.url + " ok", _transact, conf.init.version);
			}
			else
			{
				wf.httpUtil.dataError(req, res, "Error", "Bad amount", 500, "1.0");
				return;
			}

		}
	}

	/**
  *
  * @function addTransactionToBlock
  * @param {object} req request parametre
  * @param {object} res response parametre
  * @desc Génère une transaction avec les arguments passés en POST : {from, to, amount}
  *
  */
	function addTransactionToBlock(req, res)
	{
		NEXT_BLOCK();
		var _from = req.post.from;
		var _to = req.post.to;
		var _amount = req.post.amount;
		var _password = req.post.password;

		if(!_from) { wf.httpUtil.dataError(req, res, "Error", "Missing from", 500, "1.0"); return; }
		if(!_to) { wf.httpUtil.dataError(req, res, "Error", "Missing to", 500, "1.0"); return; }
		if(!_amount) { wf.httpUtil.dataError(req, res, "Error", "Missing amount", 500, "1.0"); return; }
		if(!_password) { wf.httpUtil.dataError(req, res, "Error", "Missing password", 500, "1.0"); return; }

		if(_from == _to)
		{
			wf.httpUtil.dataError(req, res, "Error", "Can't send token to the same address", 500, "1.0");
			return;
		}

		try
		{
				CHECK_ADDRESS(_from, function(err, data)
				{
					if (!(err || data)) {
						return
					}
					console.log('from data', data)
					if(err)
					{
						wf.httpUtil.dataError(req, res, "Error", "Address From doesn't exist : " + err.message, 500, "1.0");
						return;
					}
					else
					{
						if(!data.exists)
						{
							wf.httpUtil.dataError(req, res, "Error", "Address From doesn't exist", 500, "1.0");
							return;
						}
						else if(data.balance < _amount)
						{
							wf.httpUtil.dataError(req, res, "Error", "Balance < amount", 500, "1.0");
							return;
						}
						else
						{
							CHECK_ADDRESS(_to, function(err, _data)
							{
								if (!(err || _data)) {
									return
								}
								if(err)
								{
									wf.httpUtil.dataError(req, res, "Error", "Address To doesn't exist : " + err.message, 500, "1.0");
									return;
								}
								else if(!_data.exists)
								{
									wf.httpUtil.dataError(req, res, "Error", "Address To doesn't exist", 500, "1.0");
									return;
								}
								else
								{
									var _transact = doTransaction(_from, _to, _amount, undefined, _password);
									CURRENT_BLOCK.data.content.register.push(_transact);
									FLUSH_BLOCK();
									wf.httpUtil.dataSuccess(req, res, req.url + " ok", _transact, conf.init.version);
								}
							});
						}
					}
				});
		}
		catch(e){console.log(e)}
	}

}
module.exports = blockMagement;
