var hostConf=
{
	"state": true,
	"pos": 0,
	"default_zone": "front", // default zone for /
	"default_page": "home", // default view for /
	"404": "/404/",
  "host":
  {
		"*": "all",
  },

  "app":
  {
		"init": "Init blockchain",
		"seal": "Seal block",
		"store": "Store blockchain",
		"account": "Account management",
  },
}
module.exports = hostConf
