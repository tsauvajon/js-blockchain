var wf = WF();
var CURRENT = ["all", "etape1", "first"];
var DO_TEST = false;

for(var s in wf.cli.stack)
{
  if(CURRENT.indexOf(wf.cli.stack[s].toLowerCase()) > -1) DO_TEST = true;
}

if(!DO_TEST) return;

var test =  require("../start.app.js");

console.log("[*] Verifing FIRST_TRANSACTION");

var ft = FIRST_TRANSACTION();

if(!ft) {console.error("[!] ERROR : FIRST_TRANSACTION() return null or undefined variable"); process.exit(1);}

if(!ft.type ) {console.error("[!] ERROR : type is null or undefined"); process.exit(1);}

if(!ft.id ) {console.error("[!] ERROR : id is null or undefined"); process.exit(1);}

if(!ft.from ) {console.error("[!] ERROR : from is null or undefined"); process.exit(1);}
if(ft.from != -1 ) {console.error("[!] ERROR : from is different of -1"); process.exit(1);}

if(!ft.to ) {console.error("[!] ERROR : to is null or undefined"); process.exit(1);}
if(!VERIFY_ADDRESS(ft.to) ) {console.error("[!] to is not a valid address"); process.exit(1);}

if(ft.amount == undefined) {console.error("[!] ERROR : amount is null or undefined"); process.exit(1);}
if(typeof ft.amount != "number") {console.error("[!] ERROR : amount is not a number"); process.exit();}

console.log("[+] INFO : FIRST_TRANSACTION is ok");
