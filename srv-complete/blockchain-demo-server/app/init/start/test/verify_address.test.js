var wf = WF();
var CURRENT = ["all", "etape1", "verify"];
var DO_TEST = false;

for(var s in wf.cli.stack)
{
  if(CURRENT.indexOf(wf.cli.stack[s].toLowerCase()) > -1) DO_TEST = true;
}

if(!DO_TEST) return;

var test =  require("../start.app.js");

console.log("[*] Verifing VERIFY_ADDRESS");

var notAddress = ["0", 1, 1000000, "_AAAAAAAAAAAAAAAAAAAAA", "Bx000000000000000000000000000000000000000000000000000000000000000"];

var isAddress = ["Bx0000000000000000000000000000000000000000000000000000000000000000", "Bxa1ce31fc61c8779217d064039a0ac83b47b39f9bb13121a07d51ea60f90dd64f"];


for(var n in notAddress)
{
  if(VERIFY_ADDRESS(notAddress[n]) !== false)
  {
    console.error("[!] ERROR : " + notAddress[n] + " is not a valid address");
    process.exit(1);
  }
}

for(var i in isAddress)
{
  if(VERIFY_ADDRESS(isAddress[i]) !== true)
  {
    console.error("[!] ERROR : " + notAddress[n] + " is a valid address");
    process.exit(1);
  }
}

console.log("[+] INFO : VERIFY_ADDRESS is ok");
