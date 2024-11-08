const user = {
  name: 'Sammy',
  email: 'Sammy@domain.com',
  plan: 'Pro',
  name: 'Edson',
  name: 'COnsegui',
  name: 'Etelvina',
};

const userStr = JSON.stringify(user);

//	for (x in user ){
//		console.log()
//	}
/*
var myK = Object.keys(user);
console.log(myK);

for (var i = 0; i < myK.length; i++){
	var test = myK[i];
	console.log(user[test])
}

*/
var myKeys = Object.keys(user);
//console.log(myKeys);
for (var i = 0; i < user.length; i++){

   //var iter = myKeys[i];

   //console.log(user.iter);
   console.log(user[i].name);
}


var list = [];

JSON.parse(userStr, (key, value) => {
  if ( key === 'name') {
  	list.push(value.toUpperCase());
  	//console.log("Testing " + value.toUpperCase());
    //return value.toUpperCase();
    console.log("List = " + list);
    return list;
  }
  console.log("Testing 2 " + value);
  return value;
});