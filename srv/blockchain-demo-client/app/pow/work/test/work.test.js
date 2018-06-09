var wf = WF();
var CURRENT = ["all", "etape4", "hash"];
var DO_TEST = false;
var OK = false;

for(var s in wf.cli.stack)
{
  if(CURRENT.indexOf(wf.cli.stack[s].toLowerCase()) > -1) DO_TEST = true;
}

if(!DO_TEST) return;

var test =  require("../work.app.js");
test = new test({init:{version:"TEST"}});

console.log("[*] Verifing calcHash");

var _str = "a";
var _difficulty = 14;

var result = test.accessCalcHash(_str, _difficulty);

if(!result)
{
  console.error("[!] ERROR : result of accessCalcHash is null or undefined");
  process.exit(1);
}

if(typeof result != "object")
{
  console.error("[!] ERROR : result should be an object, it's : " + typeof result);
  process.exit(1);
}

if(!result.seal)
{
  console.error("[!] ERROR : result should contains seal");
  process.exit(1);
}

if(!result.junk)
{
  console.error("[!] ERROR : result should contains junk");
  process.exit(1);
}

if(typeof result.seal != "string")
{
  console.error("[!] ERROR : result.seal should be a string, it's : " + typeof result.seal);
  process.exit(1);
}

if(typeof result.junk != "string")
{
  console.error("[!] ERROR : result.junk should be a string, it's : " + typeof result.junk);
  process.exit(1);
}

if(result.seal.length != 64)
{
  console.error("[!] ERROR : result.seal should be a string of 64 char");
  process.exit(1);
}

if(result.seal != wf.Crypto.createSHA256(_str + result.junk))
{
  console.error("[!] ERROR : result.seal doesn't correspond to hash of _str + junk");
  process.exit(1);
}

for(var c in result.seal)
{
  _tmp = parseInt(result.seal[c], 16);
  if(_tmp > _difficulty)
  {
    console.log(result.seal, c, _tmp, _difficulty)
    console.error("[!] ERROR : Bad hash, difficulty not respected");
    process.exit(1);
  }
}

console.log("[+] calcHash is ok");
