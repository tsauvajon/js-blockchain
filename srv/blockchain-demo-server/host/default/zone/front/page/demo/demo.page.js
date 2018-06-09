
function demo()
{
  this.code = function(req, res)
  {
    res.end(this.view['demo'].replace("__INIT__", INIT_ADDRESS).replace("__CURRENT__", CURRENT_CONF.current));
  }
}

module.exports = demo;
