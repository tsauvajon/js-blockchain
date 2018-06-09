var wf = WF();
var CURRENT = ["all", "etape2", "create"];
var DO_TEST = false;
var OK = false;

for(var s in wf.cli.stack)
{
  if(CURRENT.indexOf(wf.cli.stack[s].toLowerCase()) > -1) DO_TEST = true;
}

if(!DO_TEST) return;

var test =  require("../manage.app.js");
test = new test({init:{version:"TEST"}});

console.log("[*] Verifing createAccount");

global.CURRENT_BLOCK = {data:{content:{register:[]}}};

var res =
{
  end: function(_res)
  {
    try
    {
      _res = JSON.parse(_res);
      if(!_res.data)
      {
        console.error("[!] ERROR : result doesn't contain data");
        process.exit(1);
      }
      else if(!_res.data.id)
      {
        console.error("[!] ERROR : result doesn't contain an id");
        process.exit(1);
      }
      else if(!VERIFY_ADDRESS(_res.data.id))
      {
        console.error("[!] ERROR :  result id is not a valid address : " + _res.data.id);
        process.exit(1);
      }

      if(CURRENT_BLOCK.data.content.register.length != 1)
      {
        console.error("[!] ERROR :  address is not added to CURRENT_BLOCK");
        process.exit(1);
      }
      else if(CURRENT_BLOCK.data.content.register[0].type != "n")
      {
        console.error("[!] ERROR :  address is not added to CURRENT_BLOCK");
        process.exit(1);
      }
      else if(CURRENT_BLOCK.data.content.register[0].from != -1)
      {
        console.error("[!] ERROR :  from should be -1");
        process.exit(1);
      }
      else if(CURRENT_BLOCK.data.content.register[0].to != _res.data.id)
      {
        console.error("[!] ERROR : to should be the address " + _res.data.id);
        process.exit(1);
      }
      OK = true;
      console.log("[+] INFO : createAccount is ok");
    }
    catch(e)
    {
      console.error("[!] ERROR : Function result is not a valid JSON");
      process.exit(1);
    }
  }
}

test.createAccount({"url": "testing", "param":{}}, res);
if(!OK)
{
  console.error("[!] ERROR : you have to use wf.httpUtil.dataSuccess on res param");
  process.exit(1);
}
