
//Muss das Traffic.Aufkommen von der Email2Role mal schlauer angehen. Nicht jede Funktion muss/kann da jedesmal alles laden oder?
//Idee: In den jeweiligen Funktionen checken, ob userData == null ist, und falls ja, einmal ne Funktion aufrufen, die die emailToRole once abfrgt
//und in eben diese Struktur speichert. Dann braucht nicht jede Funktion diese Daten selbst abzufragen.

//Überhaupt: Mobile-Clients sollten  vielleicht auf die Admin Funktion verzichten, um dieses Datenaufkommen zu vermeiden. In dem Fall hab ich schonmal
//Mist gemacht, weil ich in kalender.js nen Aufruf von getAuth-Fubktion aufm Server durch nen Zugriff auf die emailToRoleData - Map ersetzt habe. Das//müsste dann ggf rückgängig 
//gemacht werden.

//var originalUserData=null;
var uid2EmailMap = {};
var originalUserEmails = []; //Bereits als Keys

var userDataIzDa = false;
var jahreDataIzDa = false;

var emailToRoleData = null;

function auswertung() {

	$("[name=buchungenView]").hide();	
	$("[name=kalenderView]").hide();
	$("[name=user2RoleView]").hide();	
	$("[name=auswertungView]").show();
	
	//Checken, ob EmailToRoleData schon da ist (hier noch nicht implementiert) und dann daraus ein Dropdwon basteln
	
	var dropdownUserHTML='<option value="null">Alle Parkplatzbesitzer</option>';
	var keys = Object.keys(emailToRoleData);
	console.log("emailToRoleData-keys:" + keys);
    
	for (var i in keys) {
		var data = emailToRoleData[keys[i]];
		//console.log(data, data.parkId);
		if (data.parkId != 'null') {
			var email  = keys[i].replace(/!/g,'.');
			dropdownUserHTML+='<option value="'+data.uid+'">'+email +'</option>';
		}
	}
		
	//dropdownUserHTML+="</select> ";
	$("#selectUser").html(dropdownUserHTML);		
	$('#selectUser').puidropdown();
	
	var dropdownJahreHTML = '<select id="selectJahre">';
	$.get( "https://us-central1-parkingtool-6cf77.cloudfunctions.net/getJahre", function( data ) {
		console.log("/getJahre: "+data);
		var lines = data.split("\n");
		console.log("Lines: "+lines, lines.length);		
		for (var i =0; i<lines.length-1;i++) {
			dropdownJahreHTML+='<option value="'+lines[i]+'">'+lines[i]+'</option>';
		}
		dropdownJahreHTML+="</select>";
		$("#jahreDiv").html(dropdownJahreHTML);
		$('#selectJahre').puidropdown();		
		jahreDataIzDa=true;
		if (userDataIzDa) {
			$("#goButtonDiv").html('<button onclick="goButtonOnClick(null)">GO!</button>');		
		}
	});
}	

function goButtonOnClick(uid) {
	/*uid ist entweder null, falls der GO! Button geklickt wurde. In dem Fall, wird die Uid aus dem Select-Element geholt.
	  Falls uid !null ist, wurde die Funktion über einen Detail-Button aufgerufen.*/
	if (!uid || uid=='null') {
		uid  = $("#selectUser").find(":selected").val().replace(/\./g, '!');//attr("id") ;	
		if (!uid) { uid='null'; }
	}
	console.log("UID: "+uid);	
	
	var node = $("#selectJahre").find(":selected").val() ;
	if (!node) { node = '2017' };
	console.log("goButtonOnClick (Via GO! oder Detail): " + uid + ", "+node);
	
	$.get( "https://us-central1-parkingtool-6cf77.cloudfunctions.net/auswertung?uid="+uid+"&node="+node, function( data ) {						
		console.log("Data: "+data);
				
		var lines = data.split("\n");
		console.log("Lines: "+lines + ". Lines length: "+lines.length);
		
		//das soll mal einer raffen! Ich verstehs im nachhinein nicht mehr. lines kann doch kein integer sein! O_o
		//if (lines==1) { lines=2; }

		var inHTML="";
		if (uid!='null') { 				
		//Freigaben eines konkreten Users anzeigen
			inHTML = "<tr><th>Datum</th><th>Vermietet an</th></tr>";//</th><th>Detail</th></tr>";
			//Ab 1 loszählen, weil die erste Line nochmal UserId, freigegeben, davon_gebucht ist.
			var datum_moment = moment().year(node);
			for (var i =1; i<lines.length-1;i++) {
				var tokens = lines[i].split(',');
				//console.log(i+":");
				//console.log("KW: "+tokens[0]);
				//console.log("Tag-ParkId: "+tokens[1]);
				//console.log("mieter: "+tokens[2]);
				
				datum_moment = datum_moment.week(tokens[0].substr(2,3));				
				datum_moment = moment(datum_moment).day(tokens[1].substr(0,1));				
				inHTML+='<tr><td class="auswertungslot">'+moment(datum_moment).format('DD.MM.YYYY')+'</td>' +                
                  "<td class='auswertungslot'>";
										
				inHTML+=getEmailToUid(tokens[2])+"</td></tr>";
			}	
		}
		else { 						
		//Falls keine besondere Uid angefragt wurde, also einfach eine Auflistung der Freigaben aller Vermieter gefragt war:	
			inHTML="<tr><th>User</th><th>Freigaben</th><th>Davon gebucht</th><th>Detail</th></tr>";		
			for (var i =0; i<lines.length-1;i++) {
				var tokens = lines[i].split(',');
				        
				inHTML+='<tr><td class="auswertungslot">'+getEmailToUid(tokens[0])+'</td>' +
                "<td class='auswertungslot'>"+tokens[1]+"</td>" +
                "<td class='auswertungslot'>"+tokens[2]+"</td>" +
                "<td style='border: none; width: auto;'><button class='goButton' onclick='goButtonOnClick(\""+tokens[0]+"\")'>Detail</button></td></tr>";	
			}	
		}	
		$("#auswertungTable").html(inHTML);		
		userDataIzDa=true;
		if (jahreDataIzDa) {
			$("#goButtonDiv").html('<button onclick="goButtonOnClick()">GO!</button>');		
		}

	});			
}

function getEmailToUid(uid) {
	/*Bekommt eine Uid und liefert die Email dazu. Kann 3 Fälle geben: 
				1: Email zur UserId bekannt
				2: gar keine UserId eingetragen (mieter: null)
				3: keine Email zur UserId bekannt (da gelöscht worden o.ä.) */
	if (uid=='null') {		
		return "Niemand";
	}
	var keys = Object.keys(emailToRoleData);
	var rtrn = null;
	for (i in keys) {
		if (emailToRoleData[keys[i]].uid==uid) {
			rtrn=keys[i].replace(/!/g, '.');
			break;
		}
	}
	
	if (rtrn==null) {		
		rtrn = "Unbekannte UserID: "+uid;
	}
	return rtrn;
}

function getEmailToParkId(parkId) {
	//Bekommt eine ParkId und liefert die Email dazu.
	var keys = Object.keys(emailToRoleData);
	var rtrn = null;
	for (i in keys) {
		if (emailToRoleData[keys[i]].parkId==parkId) {
			rtrn=keys[i].replace(/!/g, '.');
			break;
		}
	}
	return rtrn;
}

function getUidToEmail(email) {
	//Bekommt eine Email und liefgert die Uid dazu
	var keys = Object.keys(emailToRoleData);	
	var rtrn = null;
	for (i in keys) {
		//console.log("GETUID2EMAIL: "+i,keys[i], emailToRoleData[keys[i]].uid, emailToRoleData[keys[i]].admin, emailToRoleData[keys[i]].parkId);
		if (keys[i]==email) {
			rtrn=emailToRoleData[keys[i]].uid;;
			break;//return keys[i];
		}
	}
	return rtrn;
}
function getEmailToRoleData() {
	console.log("GetEmailToRoleData...");
	//Lädt einmal initial  (oder lieber dauerhaft getriggert?) die Userdaten
	//var dfd = $.Deferred();			
			
		//	setTimeout(function () {
				//
				firebase.database().ref('/emailToRole/').once('value').then(function (snapshot) {
					emailToRoleData = snapshot.val();
					console.log("EmailToRoleData ist da! :) ");
					var keys = Object.keys(snapshot.val());
					for (k in keys) {
						console.log(keys[k]+":");
						if (emailToRoleData[keys[k]].uid == userId) {
							console.log("User Rolle festlegen!");
							admin = emailToRoleData[keys[k]].admin;
							if (admin=='true') {
								var adminButton=document.getElementsByClassName('dropdown');					
								adminButton[0].style.display= "inline-block";
								document.getElementById("adminToolToggle").style.display="block-inline";
							}
							var rolle="Mieter";
							if (emailToRoleData[keys[k]].parkId != 'null') {	  				  
								userParkId=parseInt(emailToRoleData[keys[k]].parkId);
								rolle = "Vermieter, P:"+userParkId;
							}
							console.log ("Festgelegt auf: Admin:"+admin+ " Rolle:"+rolle);
							$("#status").text("Eingeloggt als:\n"+rolle);
						}
				
						console.log("  :"+emailToRoleData[keys[k]].admin);
						console.log("  :"+emailToRoleData[keys[k]].parkId);
						console.log("  :"+emailToRoleData[keys[k]].uid);
						
					}
					
			//		dfd.resolve(ergebnis);
				generateTable();
				});
			//}, 0);			
			//return dfd.promise();			
		
		
	//});
}

		
function showUser2Role() {
	//Eigentlich ja auch Listener abmelden. Wenn ich sowieso alles an und abmelde, kann ich zwei getrennte HTMLs und JS machen
	
	$("[name=buchungenView]").hide();	
	$("[name=kalenderView]").hide();
	$("[name=user2RoleView]").show();
	$("[name=auswertungView]").hide();	
	
	//Dropdown-Liste für die Parkplätze erzeugen. Mach ich doch nachher nochmal??!
	/*var dropdownHTML='<select name="lots"><option value="null">Kein Parkplatz</option>';
	for (var i=1;i<=anzahl_parkplaetze;i++) {
		dropdownHTML+='<option value="'+i+'">Platz '+i+'</option>';
	}
	dropdownHTML+="</select>";
	*/
	// Tabelle erzeugen. 
    //var inHTML="<tr><th>User-Email</th><th>Parkplatz</th><th>Admin</th><th></th></tr>";
	
	//Hier kann ich auch die Daten aus emailToRoleData verwenden!
	//firebase.database().ref('/emailToRole/').once('value').then(function (snapshot) {
		
		//var inHTML = "";//'<div id="te_di"><p>Blablabla</p></div><div><div><a data-icon="fa-file-o">File</a></div><div><ul><li><a data-icon="fa-plus">New</a><ul><li><a>Project</a></li><li><a>Other</a></li></ul></li><li><a>Open</a></li><li><a>Quit</a></li></ul></div></div>';
		var inHTML ="<h2>User-Verwaltung</h2><div id='user_acc'>";
		
		//originalUserData=snapshot;		
		var keys = Object.keys(emailToRoleData);
		console.log("Email2Role-keys:"+keys);
    
		//Iteriert über alle Einträge des Knotens email2Rolle, sprich die Zuordnung User->Parkplatz#,Admin?
		for (var i in keys) {			
  		  //var data = snapshot.val()[keys[i]];		
		  var data = emailToRoleData[keys[i]];
		  console.log("==> "+i, keys[i]);
		  originalUserEmails.push(keys[i]);
			//Baut für jeden Eintrag einen HTML-Button inkl Dropdown-Menü zum Bearbeiten
			
			/*inHTML += '<button onclick=\"togglePanel(\'panel_'+i+'\')" class="accordion" id="button_'+i+'">'+keys[i].toString().replace(/!/g,".")+'</button>'+
				'<div class="panelHide" id="panel_'+i+'">'+
				'<input type="text" value="'+keys[i].toString().replace(/!/g,".")+'" id="emailInput_'+i+'"></input><br></br>'+
				'<select id="selectInput_'+i+'"><option value="null">Kein Parkplatz</option>';
			*/
			inHTML+="<h3>"+keys[i].toString().replace(/!/g,'.')+"</h3><div id='user_entry_"+i+"'>";
			
			inHTML+='<input type="text" value="'+keys[i].toString().replace(/!/g,".")+'" id="emailInput_'+i+'"></input><br></br>'+
				'<select id="selectInput_'+i+'"><option value="null">Kein Parkplatz</option>';
			
			//Generiert die Dropdown-Liste der Parkplätze
			for (var j=1;j<=anzahl_parkplaetze;j++) {
				if (j!=data.parkId) {
					inHTML+='<option value="'+j+'">Platz '+j+'</option>';
				} else {
					inHTML+='<option value="'+j+'" selected>Platz '+j+'</option>';
				}
			}
			inHTML+="</select><br></br>";			
			if (data.admin=='true') {
				inHTML+='Admin: <input type="checkbox" id="cbInput_'+i+'" checked></input><br></br>';
			} else {
				inHTML+='Admin: <input type="checkbox" id="cbInput_'+i+'"></input><br></br>';
			}
			inHTML+= '<button onclick="saveButton(\''+i+'\')">Speichern</button> <button onclick="deleteButton(\''+i+'\')">Löschen</button></div>';//</button></br>';			
		}
		inHTML+="</div>";
		$("#userTable").html(inHTML);
		console.log(inHTML);
				$('div').filter(function() {
			return this.id.match(/acc/);
		}).puiaccordion();		
		$('#te_di').puipanelmenu();

}

function togglePanel(id) {
	console.log("Toggle sichtabrkeit von "+x+"("+id+"): ");
	
	var x = document.getElementById(id);
    if (x.className.indexOf("panelShow") == -1) {
        x.className = "panelShow";
    } else { 
        x.className = "panelHide";//x.className.replace(" w3-show", "");
    }
}
function saveButton(index) {
	console.log("Speichere den Listen-eintrag #"+index+"...");
	var email = $("#emailInput_"+index).val().replace(/\./g,'!');
	var email_old = originalUserEmails[index];//Object.keys(originalUserData.val())[index];
	var pid   = $("#selectInput_"+index).find(":selected").val() ;
	var admin = $("#cbInput_"+index).prop("checked") ;
	
	var uid = getUidToEmail(email_old);
	
	console.log (email , email_old, uid);
	//Vergleich, ob die Email geändert wurde. Falls nein, ein simples Update. Falls ja: Aufwand!
	if( email != email_old) {
		//wurde ärgerlicherweise geändert. Das bedeutet: in der DB muss der Eintrag unterm alten Key gelöscht werden und 
		//der User-Eitrag in Auth muss die Email ändern. (und um den user zu finden brauch ich findUserByEmail) Unter der neuen Email ein neuer Eintrag in der DB.
		console.log("Komplettes Gerappel");
		$.get( "https://us-central1-parkingtool-6cf77.cloudfunctions.net/updateEmailAdress?email_old="+email_old+"&email_new="+email+"&pid="+pid+"&admin="+admin+"&uid="+uid, function( data ) {						
				
				//Hier muss jetzt das originalUserEmail-Array an der Stelle geupdated werden. onst wird jedesMal erneut das komplette gerappel getriggert.
				//Am liebsten die Antwort tokenizen in nen Anzeige-text und nen return-code.
				
				if (data=="success") {
					originalUserEmails[index]=email;
					//alert("Userdaten erfolgreich aktualisiert!");
					addMessage([{severity: 'info', summary: 'User-Verwaltung', detail: 'Die Änderungen wurden erfolgreich übernommen.'}]);
				} else {
					//alert(data);
					addMessage([{severity: 'error', summary: 'User-Verwaltung', detail: 'Die Änderungen konnten nicht gespeichert werden.'}]);
				}
		});		
		
	} else {
		//email blieb beim Alten! :)
		console.log("Nur update!");
		$.get( "https://us-central1-parkingtool-6cf77.cloudfunctions.net/updateE2R?email="+email+"&pid="+pid+"&admin="+admin+"&uid="+uid, function( data ) {
			console.log("updateE2R: "+data);			
			if (data=="success") {					
				addMessage([{severity: 'info', summary: 'User-Verwaltung', detail: 'Die Änderungen wurden erfolgreich übernommen.'}]);
			} else {
				addMessage([{severity: 'error', summary: 'User-Verwaltung', detail: 'Die Änderungen konnten nicht gespeichert werden.'}]);
			}
		});			
	}
}

function deleteButton(index) {
	console.log("Admin möchte User löschen!");
	//Erstmal ein Dialog!
	var inHTML="<h1>User löschen</h1>"+
			"<p>Sind Sie sicher, dass Sie den User "+originalUserEmails[index].replace(/!/g,'.')+" löschen wollen?</p>"+
			"<p>Das lässt sich nicht rückgängig machen!</p>";
		
	document.getElementById("gdo-ok").innerHTML= "LÖSCHEN";		
	document.getElementById("gdo-ok").style.display= "inline";		
	document.getElementById("gdo-cancel").innerHTML="ABBRUCH";
	document.getElementById("gdo-cancel").style.display= "inline";	

	document.getElementById("gdo-p").innerHTML = inHTML;

	document.getElementById("gdo-ok").onclick = function () {
		document.getElementById("generic-dialog-overlay").style.display = "none";
		$.get( "https://us-central1-parkingtool-6cf77.cloudfunctions.net/deleteUser?email="+originalUserEmails[index], function( data ) {
			console.log(data);
			if (data == 'success') {
				//alert("User erfolgreich gelöscht!");			
				addMessage([{severity: 'info', summary: 'User-Verwaltung', detail: 'Der User wurde erfolgreich gelöscht.'}]);
				console.log("#button_"+index);
				$("#button_"+index).remove();
				$("#panel_"+index).remove();
			} else {
				addMessage([{severity: 'error', summary: 'User-Verwaltung', detail: 'Der User konnte nicht gelöscht werden.'}]);
			}
		});
	};
	document.getElementById("gdo-cancel").onclick = function () {
		document.getElementById("generic-dialog-overlay").style.display = "none";
	};
	document.getElementById("generic-dialog-overlay").style.display = "block";

}
function editUser2RoleClickListener(event) {
	console.log("Admin möchte User-Rolle editieren");
		
	//Detail-View einblenden				
	var targetElement = event.target || event.srcElement;
	var col = $(this).parent().children().index($(this));
	var row = $(this).parent().parent().children().index($(this).parent());
	
	//console.log(
		
	document.getElementById("gdo-ok").innerHTML= "SPEICHERN";		
	document.getElementById("gdo-ok").style.display= "inline";		
	document.getElementById("gdo-cancel").innerHTML="ABBRUCH";
	document.getElementById("gdo-cancel").style.display= "inline";		
	
	var inHTML="<h1>User-Rolle bearbeiten</h1>";
	
	document.getElementById("gdo-p").innerHTML = inHTML;
	document.getElementById("gdo-ok").onclick = function () {	
		document.getElementById("generic-dialog-overlay").style.display = "none";
	}
	document.getElementById("gdo-cancel").onclick = function() {
		document.getElementById("generic-dialog-overlay").style.display = "none";
	};
	document.getElementById("generic-dialog-overlay").style.display = "block";			
	
}


function onAdminEdit(p,col) {
	//Dieses räudige Fenster bruacht so viele infos!
	console.log ($("#adminToolToggle"), "-",$("#adminToolToggle").puitogglebutton('isChecked'));

	console.log("EditingMode:"+$("#adminToolToggle").puitogglebutton('isChecked'));
	if (!$("#adminToolToggle").puitogglebutton('isChecked')) return;
	//Zu diesem Termin muss jetzt ne Anfrage4 gestellt werden, ob und was bereits an diesem Termin im System vorhanden ist.
	
	var refString = 'buchungen/'+moment(workMoment).format('YYYY')+'/KW'+kalenderWoche+'/'+col+'-'+p+'/';
	console.log(refString);
	$("#gpui-ok").text="Speichern";
	$("#gpui-cancel").text="CANCEL";
	document.getElementById("gpui-cancel").style.display="block-inline";

	firebase.database().ref(refString).once('value', function(snapshot) {
		var inHTML = "<h3>Buchung anlegen/editieren!</h3>Achtung: Ändern der Vermieter-Email mit Vorsicht!";
		
		//Vermieter Email: Entweder ist schon ne Buchung an diesem Slot vorhanden, dann nehmen wir diese Infos
		//oder es ist keine, dann nehmen wir den Vermieter, dem dieser P zugeordnet ist.
		var buchTag = getExactDateAsMoment(col);
		var vermieter_email="niemand";
		var mieter_email =  "niemand";
		var bezahlt="false";
		var erhalten="false";
		if (snapshot.val()) {
			//Hier kann ich dann die Mieter, Vermieter, Checkboxes et rausholen um die im Dropdown vcorauszuwählen
			//inHTML+="<p>"+Object.keys(snapshot.val())+"</p>";
			console.log ("snapshot: "+Object.keys(snapshot.val()) );
			console.log ("Email zur VermieterId: "+ getEmailToUid(snapshot.val()['vermieter']) );
			vermieter_email = getEmailToUid(snapshot.val()['vermieter']);
			mieter_email = getEmailToUid(snapshot.val()['mieter']);
			bezahlt = snapshot.val()['bezahlt'];
			erhalten = snapshot.val()['erhalten'];
			console.log ("Freigabe besteht bereits: "+vermieter_email, mieter_email, bezahlt, erhalten);

		}
		//Falls keine Vermieter-Email gefunden wurde, weil noch keine Freigabe in dem Slot vorliegt, dann die zugeordnete Email holen.
		else {
			vermieter_email = getEmailToParkId(p);
			console.log("Email zu ParkId "+p+": "+vermieter_email);
		}
		var vermieterHTML='<p>Vermieter:<br><select id="select_vermieter"><option value="null">Email des Vermieters</option>';
		var mieterHTML='<p>Mieter:<br><select id="select_mieter"><option value="null">Email des Mieters</option>';
		var keys = Object.keys(emailToRoleData);
		for (var i in keys) {
			var data = emailToRoleData[keys[i]];
			var email  = keys[i].replace(/!/g,'.');
			if (data.parkId != 'null') {
				//Falls email die des Vermieters, dann diese Select-Option vorauswählen
				vermieterHTML+='<option value="'+data.uid+'"';
				if (email == vermieter_email) {
					vermieterHTML+=" selected";
				}
				vermieterHTML+='>'+email +'</option>';
			}
			else {
				//var email  = keys[i].replace(/!/g,'.');
				mieterHTML+='<option value="'+data.uid+'"';
				if (email == mieter_email) {
					mieterHTML+=" selected";
				}
				mieterHTML+='>'+email +'</option>';
			}
		}
		vermieterHTML+="</select></p>";
		mieterHTML+="</select></p>";
		inHTML+=vermieterHTML;		
		inHTML+=mieterHTML;
		
		//inHTML+='<div id="bezahlt_erhalten"/></div>';
		inHTML+='<p><input type="checkbox" id="cb_bezahlt"';
		
		if (bezahlt==true) {		
			inHTML+=" checked";
		}
		inHTML+='></input>Zahlung vom Mieter geleistet</p>';		
		inHTML+='<p><input type="checkbox" id="cb_erhalten"';
		if (erhalten==true) {
			inHTML+=" checked";
		}
		inHTML+='></input>Zahlung vom Vermieter erhalten</p>';

		inHTML+="<button id='deleteFreigabeButton'>Freigabe löschen!</button>";
		document.getElementById("gpui-p").innerHTML = inHTML;
		
		$('#bezahlt_erhalten').puiselectbutton({
			choices: [
				{label:'Zahlung geleistet', value:0},
				{label:'Zahlung erhalten', value:1}
			],
			multiple: true
		});
		//Jetzt noch Klick Lisener für die Buttons
		document.getElementById("gpui-cancel").onclick = function() {
			$("#generic-puidialog").puidialog('hide');
		};
		
		document.getElementById("gpui-ok").onclick = function() {
			console.log ("Eingestellte Daten:");
			var vermieter = $("#select_vermieter").find(":selected").val() ;
			var mieter = $("#select_mieter").find(":selected").val() ;
			bezahlt = $("#cb_bezahlt").prop("checked") ;
			erhalten = $("#cb_erhalten").prop("checked") ;
			console.log (vermieter, mieter, bezahlt, erhalten);
			
			//Eintrag reinschreiben! Success Listener etc anmelden
			firebase.database().ref(refString).set({vermieter: vermieter, bezahlt: bezahlt, erhalten: erhalten, mieter: mieter});
			//...aber erstmal: Einfach weg das fenster
			$("#generic-puidialog").puidialog('hide');
		};
		
		document.getElementById("deleteFreigabeButton").onclick = function() {
			console.log("Lösche "+refString);
			firebase.database().ref(refString).remove();				
			addMessage([{severity: 'info', summary: 'Freigabe gelöscht', detail: 'Die Freigabe '+refString+' wurde gelöscht.'}]);
			//Soll dann in dem Fall Emails verschickt werden? Es soll.
			if (mieter_email != 'niemand') {
				console.log("Email an Mieter senden: "+mieter_email);
				var text = "Tut uns leid, aber ihre Buchung des P"+col+" am "+moment(buchTag).format('DD.MM.YYYY') +" wurde vom Administrator storniert.";
				$.get( "https://us-central1-parkingtool-6cf77.cloudfunctions.net/email?to="+mieter_email+"&subject=Ihre%20Buchung%20wurde%20gelöscht&text="+text, function( data ) {
					console.log("Email verschickt: "+text);
				});
			}
			$("#generic-puidialog").puidialog('hide');
		};
	
		$("#generic-puidialog").puidialog('show');
	
	});
			
	
}