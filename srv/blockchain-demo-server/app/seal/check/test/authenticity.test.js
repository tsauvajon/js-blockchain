var wf = WF();
var CURRENT = ["all", "etape3", "authenticity"];
var DO_TEST = false;
var OK = false;

for(var s in wf.cli.stack)
{
  if(CURRENT.indexOf(wf.cli.stack[s].toLowerCase()) > -1) DO_TEST = true;
}

if(!DO_TEST) return;

var test =  require("../check.app.js");
test = new test({init:{version:"TEST"}});

console.log("[*] Verifing authenticityFlow");

test.setAuthenticity({ state: false, error: "test error"});

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
    }
    catch(e)
    {
      console.error("[!] ERROR : Function result is not a valid JSON");
      process.exit(1);
    }
    OK = true;
  }
}

test.authenticityFlow({}, resFalse);
if(!OK)
{
  console.error("[!] ERROR : Function should raise an error with wf.httpUtil.dataError");
  process.exit(1);
}

test.setAuthenticity({ state: true, error: null});
var resTrue =
{
  end: function(_res)
  {
    console.error("[!] ERROR : Function shouldn't raise an error");
    process.exit(1);
  }
}

test.authenticityFlow({}, resTrue);
console.log("[+] authenticityFlow is ok");
