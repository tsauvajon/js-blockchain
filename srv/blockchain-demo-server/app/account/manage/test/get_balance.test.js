var wf = WF();
var CURRENT = ["all", "etape2", "balance"];
var DO_TEST = false;
var OK = false;

for(var s in wf.cli.stack)
{
  if(CURRENT.indexOf(wf.cli.stack[s].toLowerCase()) > -1) DO_TEST = true;
}

if(!DO_TEST) return;

var test =  require("../manage.app.js");
test = new test({init:{version:"TEST"}});

console.log("[*] Verifing getBalance");

global.CURRENT_BLOCK = {data:{content:{register:[]}}};

var resFalse =
{
  end: function(_res)
  {
    try
    {
      _res = JSON.parse(_res);
      if(_res.code == 0)
      {

        console.error("[!] ERROR : result should be an error");
        process.exit(1);
      }
      OK = true;
    }
    catch(e)
    {
      console.error("[!] ERROR : Function result is not a valid JSON");
      process.exit(1);
    }
  }
}
test.getBalance({"url": "testing", "param":{}}, resFalse);
if(!OK)
{
  console.error("[!] ERROR : you have to use wf.httpUtil.dataSuccess or dataError on res param");
  process.exit(1);
}

test.getBalance({"url": "testing", "param":{}}, resFalse);
test.getBalance({"url": "testing", "param":{target:"aa"}}, resFalse);

var resTrue =
{
  end: function(_res)
  {
    try
    {
      _res = JSON.parse(_res);
      if(_res.code != 0)
      {
        console.error("[!] ERROR : result shouldn't be an error");
        process.exit(1);
      }
      if(!_res.data)
      {
        console.error("[!] ERROR : result doesn't contain data");
        process.exit(1);
      }
      else if(_res.data.exists == undefined)
      {
        console.error("[!] ERROR : result doesn't contain exists key");
        process.exit(1);
      }
      else if(!_res.data.exists)
      {
        console.error("[!] ERROR :  exists key should be true");
        process.exit(1);
      }
    }
    catch(e)
    {
      console.error("[!] ERROR : Function result is not a valid JSON");
      process.exit(1);
    }
  }
}

test.getBalance({"url": "testing", "param":{target:INIT_ADDRESS}}, resTrue);

console.log("[*] getBalance is ok")
