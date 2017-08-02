var userId=null;
var email='null';
var emailAsKey;
var userParkId='null';
var kalenderWoche=0;
var admin=false;
//var minimiert=true;

//var adminEditingMode = false;
var loginStatus="ausgeloggt";

//"Balancing"-Werte. Um diese Werte im laufenden Betrieb zu ändern: einfach ne neue Version von kalender.js hosten?
//	-> dann müsste man neue Mobile-Versionen ausrollen. Also lieber in Firebase in die DB schreiben und bei Programmstart erstmal auslesen.
var frist_tage=2;
var frist_stunde=(9.5*60); //Also in Minuten
var anzahl_parkplaetze=145;
var direktVergabe=false;	//Auf Vorschlag Frank Wellers kann man diese Option irgendwann freischalten "wenn sich das eingespielt hat".



//Moment-Objkte 
var workMoment = new moment();
// BuchungenMap
var buchungsMap;

var config = {
			apiKey: "AIzaSyAc4lRwOrVEX7F9vU03KUImmL6_RV45-Ck",
            authDomain: "parkingtool-6cf77.firebaseapp.com",
            databaseURL: "https://parkingtool-6cf77.firebaseio.com",
            projectId: "parkingtool-6cf77",
            storageBucket: "parkingtool-6cf77.appspot.com",
            messagingSenderId: "506320863480"
};
        var firebaseApp = firebase.initializeApp(config);
		
		firebase.auth().onAuthStateChanged(function(user) {
		  if (user) {
			// User is signed in.
			var displayName = user.displayName;
			email = user.email;
			console.log ("Auth: logged in: "+email);
			emailAsKey=email.replace(/\./g, '!');
			//In der User-Email den . durch ! ersetzen, somit kann das als Key in Firebase verwendet werden!
			
			var emailVerified = user.emailVerified;
			var photoURL = user.photoURL;
			var isAnonymous = user.isAnonymous;
			var uid = user.uid;
			userId = user.uid;
			var providerData = user.providerData;
			
			getEmailToRoleData(); //vielleicht lieber erst nach dem Login triggern bzw erst, wenn eine Admin-View aufgerufen wird.
			//getRole();
			
			//document.getElementById("dialog-overlay-login").style.display="none";
			$('#login-dlg').puidialog('hide');
			$("[name=kalenderView]").show();
			//document.getElementById("kalenderView").style.display="block";

			
		  } else {
			  console.log("Auth: Logged out.");
			// User is signed out.
			$("#authInfoText").text("signed out!");
			//document.getElementById("dialog-overlay-login").style.display="block";
			$('#login-dlg').puidialog('show');
		  }
		});

        //var keys=(Object.keys(firebaseApp));        
		//var uid2Ref = firebase.database().ref('uid2rolle/');
        var buchungRefNeu = null;
		
		function childRemoveListener(snapshot) {
			//Na toll, scheinbar bekomme ich entgegen der Doc grnicht die Info was gelöscht wurde im Snapshot
			var deletedPost = snapshot.val();
			console.log("Die Freigabe "+Object.keys(snapshot) + " wurde gelöscht. Die Zelle muss jetzt neu gezeichnet werden!");
			
			var key=snapshot.key;
			//Wenn ich jetzt wüsste, was gelöscjt wurde, könnet ich einfach die Zelle auf blank setzen, neu zeichnen
			//und die Listener removen.
			var day = key.slice(0,1);
			var parkId = key.slice(2,key.length);							

			// Einfach mal pauschal alle Listener weg!
			var table = document.getElementById("dynamicTable");
			table.rows[parkId].cells[day].removeEventListener("click", makeFreigabeClickListener);
			table.rows[parkId].cells[day].removeEventListener("click", makeBuchungClickListener);
			table.rows[parkId].cells[day].removeEventListener("click", editFreigabeClickListener);
			table.rows[parkId].cells[day].removeEventListener("click", editBuchungClickListener);
			table.rows[parkId].cells[day].id = 'blankslot';				
			//Je nach Rolle muss an das nun leere Feld wieder ein makeXYZClickListener ran!...
			if (parkId==userParkId) {
				table.rows[parkId].cells[day].addEventListener("click", makeFreigabeClickListener);
				table.rows[parkId].cells[day].id = 'blankuserslot';
			}
			

		};
		

		function buchungListener(snapshot) {
			buchungsMap = snapshot.val();
			
			if (snapshot.val()!= null) {
				console.log("Buchung-Listener : "+ Object.keys(snapshot.val()) );
	
				var keys=Object.keys(snapshot.val());        
				var table = document.getElementById("dynamicTable");
				
				$.each(keys, function(index, value) {					
					var id='blankslot';
					//erstes char ist der Tag (1-5, definiti einstellig!), nach dem Bindestrich 1-3 Stellen Parkplatzid
					var day = value.slice(0,1);
					var parkId = value.slice(2,value.length);				
					var mieter = snapshot.val()[value].mieter;

					// Einfach mal pauschal alle Listener weg!
					table.rows[parkId].cells[day].removeEventListener("click", makeFreigabeClickListener);
					table.rows[parkId].cells[day].removeEventListener("click", makeBuchungClickListener);
					table.rows[parkId].cells[day].removeEventListener("click", editFreigabeClickListener);
					table.rows[parkId].cells[day].removeEventListener("click", editBuchungClickListener);				
		
					//Falls eigene Freigabe:
					if (parkId==userParkId) {
						table.rows[parkId].cells[day].addEventListener("click", editFreigabeClickListener);
						//table.rows[parkId].cells[day].innerHTML="editFreigabe-V";
					}
												
					// Kein Mieter eingetragen => Verfügbare Freigabe
					if (mieter == 'null') {				
						id = 'availableslot';
						//User ist Mieter: (falls User=Vermieter, dann braucht das Feld auch keinene Listener)
						if (userParkId=='null') {
							table.rows[parkId].cells[day].addEventListener("click", makeBuchungClickListener);
							table.rows[parkId].cells[day].removeEventListener("click", editBuchungClickListener);
							//table.rows[parkId].cells[day].innerHTML="makeBuchung";							
						}					
					}
					
					//Falls bereits gebuchte Freigabe:
					else {				
						id = 'unavailableslot';
						//Falls Mieter der Freigabe == der einegloggte User:
						if (mieter == userId) {
						  id = 'userslot';
						  table.rows[parkId].cells[day].addEventListener("click", editBuchungClickListener);
						}				
					}
					
					table.rows[parkId].cells[day].id = id;				
				});
			} else {
				//Kam null zurück -> wahrscheinlich eine KW, die noch nicht existiert. Hier also evtl nen neuen Node zu erzeugen.
			};
			
		};	
	
	function editBuchungClickListener(event) {
		console.log("Mieter möchte seine Buchung editieren");
		var kw = moment(workMoment).format('WW');
		var year = moment(workMoment).format('YYYY');
		var targetElement = event.target || event.srcElement;
		var col = $(this).parent().children().index($(this));		
		var row = $(this).parent().parent().children().index($(this).parent());
		var refString = '/buchungen/'+year+'/KW'+kw+'/'+col+"-"+row;

		if ($("#adminToolToggle").puitogglebutton('isChecked')) { 
			onAdminEdit(row,col);
			return;
		}
				
		
		var key = col+"-"+row;
		var buchung = buchungsMap[key];		
		var vermieter=buchung.vermieter;
		var bezahlt_original = buchung.bezahlt;
		
		document.getElementById("gpui-ok").innerHTML="OK";
		document.getElementById("gpui-cancel").innerHTML="STORNO";
		document.getElementById("gpui-ok").style.display="inline";
		document.getElementById("gpui-cancel").style.display="inline";

		var data=getEmailToUid(vermieter);
		//Detail-View einblenden sobald die Email-Adresse des Benutzers da ist... Könnte man eigentlich auch umbauen!			
		var inHTML = "<h1>Buchung bearbeiten</h1>";
		inHTML+="<p>Sie haben diesen Parkplatz P"+row+" für den "+getExactDate(col)+" gebucht.</p>";
		
		if (data != 'fail') {		
			inHTML+="<p>Sie erreichen den Besitzer unter: "+data+"</p>";		
		} else {
			inHTML+="<p>Der Besitzer konnte nicht ermittelt werden!</p>";		
		}
		
		var stornoText = "<p>Eine Stornierung ist nicht mehr möglich.</p>";
		//Mieter-Storno:
		//Möglich am selben Tag bis Morgens-Frist (9:30) und für alle zukünftigen Tage.
		var storno_button_display="none";
		var buchTag = getExactDateAsMoment(col);
			
		//Button anzeigen, falls Termin: (Heute und Morgens-Frist noch nicht abgelaufen) || ab morgen.
		if ( (moment(buchTag).isSame(moment(),'day') && isEarlyEnough()) || moment(buchTag).isAfter(moment(),'day') ) {
			storno_button_display="inline";
			stornoText = "<p>Eine Stornierung ist möglich.</p>";
			document.getElementById("gpui-cancel").onclick = function () {
				
				firebase.database().ref(refString).update({mieter:"null", bezahlt:false});
				$("#generic-puidialog").puidialog('hide');
			}
		}
			
		document.getElementById("gpui-cancel").style.display=storno_button_display;
		//console.log("Bezahlt?:"+buchung.bezahlt);
		//console.log("Erhalten?:"+buchung.erhalten);
		inHTML+=stornoText;
		inHTML+='Bezahlt: <input type="checkbox" id="cb_bezahlt" ';			
		if (buchung.bezahlt==true) { inHTML+="checked"; }
		inHTML+='></input><br></br>';
		if (buchung.erhalten==true) { inHTML+='<p>Der Vermieter hat die Buchung mit "Zahlung erhalten" markiert.</p>'; }
	
		document.getElementById("gpui-p").innerHTML = inHTML;			
		$("#generic-puidialog").puidialog('show');
			
		document.getElementById("gpui-ok").onclick = function () {		
			//Prüfen, ob eine Änderung am "Bezahlt"-Häkchen vorgenommen wurde, ggf Datenbank updaten
			var bezahlt_neu = $("#cb_bezahlt").prop("checked");
			console.log ("BEZ:"+bezahlt_original, bezahlt_neu);
			if (bezahlt_original != bezahlt_neu) {
				firebase.database().ref(refString).update({bezahlt:bezahlt_neu});
			}			
			$("#generic-puidialog").puidialog('hide');			
		};

	}
		
	function makeBuchungClickListener(event) {
		var kw = moment(workMoment).format('WW');
		var year = moment(workMoment).format('YYYY');
		console.log("Mieter möchte buchen!");			
		
		var targetElement = event.target || event.srcElement;
		var col = $(this).parent().children().index($(this));
		var row = $(this).parent().parent().children().index($(this).parent());

		
		if ($("#adminToolToggle").puitogglebutton('isChecked')) { 
			onAdminEdit(row,col);
			return;
		}
				
		if ( isInPast (getExactDateAsMoment(col)) ) {
			addMessage([{severity: 'error', summary: 'Buchung nicht möglich', detail: 'Der Tag liegt in der Vergangenheit.'}]);
			return;
		}
		
		document.getElementById("gpui-ok").innerHTML= "BUCHEN";		
		document.getElementById("gpui-ok").style.display= "inline";		
		document.getElementById("gpui-cancel").innerHTML="ABBRUCH";
		document.getElementById("gpui-cancel").style.display= "inline";		

		var refString = '/buchungen/'+year+'/KW'+kw+'/';
		//Prüfen, dass 1 User keine 2 Buchungen an 1 Tag macht. 
		firebase.database().ref(refString).once('value').then(function (snapshot) {
			var inHTML = "<h1>Parkplatz buchen</h1>";
			var kannBuchen=1;
			console.log("Prüfen, ob "+userId + " an Tag "+col+" schon nen P hat:");
			$.each(snapshot.val(), function(index, value) {				
				//Prüfen, ob der Tag des jeweiligen eintrags der ist, wo auch der User sich eintragen will
				var slice = index.slice(0,1);				
				if (slice == col) {
					//Wenn ja, schauen, ob diese Buchung vom aktuellen user vorgenommen wurde!
					console.log("index:"+index+" / Mieter:"+value.mieter);
					if (value.mieter == userId) {					
						kannBuchen=0;
						//inHTML+="<p>Sie haben an diesem Tag bereits den P"+index.slice(2,index.length)+ " gebucht!</p>";
						//document.getElementById("gpui-ok").style.display = "none";		
						addMessage([{severity: 'error', summary: 'Buchung nicht möglich', detail: 'Sie haben an diesem Tag schon P'+index.slice(2,index.length)+' gebucht.'}]);
					}							
				}
			});
			
			console.log("Kann buchen? "+kannBuchen);
			if (kannBuchen==1) {
				inHTML+="<p>Möchten Sie den Parkplatz P"+row+ " für den "+getExactDate(col)+" buchen?</p>";
				inHTML+="<p>Damit verpflichten Sie sich, dem Besitzer "+"2€/Tag"+ " zu zahlen.</p>"; 
				//ClickListener an die beiden Buttonsh ängen
				document.getElementById("gpui-ok").style.display = "inline";
				document.getElementById("gpui-ok").onclick = function () {
					var refString = '/buchungen/'+year+'/KW'+kw+'/'+col+"-"+row;
					firebase.database().ref(refString).update({mieter: userId});//set({vermieter: userId, bezahlt: 'false', erhalten: 'false'});
					//$.get( "https://us-central1-parkingtool-6cf77.cloudfunctions.net/makeBuchung?parkId="+row+"&userId="+userId+"&day="+col, function( data ) {								
					//});	
					//document.getElementById("generic-dialog-overlay").style.display = "none";
					$("#generic-puidialog").puidialog('hide');
				}								
				document.getElementById("gpui-p").innerHTML = inHTML;
				//document.getElementById("generic-dialog-overlay").style.display = "block";
				$("#generic-puidialog").puidialog('show');
			}
			document.getElementById("gpui-cancel").onclick = function () {
				//document.getElementById("generic-dialog-overlay").style.display = "none";
				$("#generic-puidialog").puidialog('hide');
			}
			
			
		});
	}
	
	function isInPast(buchTag) {
		//Ich ziehe von heute 1 Tag ab, damit ich noch für den heutigen tag Änderungen vornehmen kann (Freigeben,Buchen,...)
		var heute = moment().subtract(1,'days');
		//heute.set('hour',0);
		//heute.set('minute',frist_stunde);
		//heute.set('seconds',0);
		console.log("isInPast: \nBuch:"+ moment(buchTag).format('DD.MM.YYYY') +" - " + moment(buchTag).format('HH:mm:ss')+ "\nHeute:"+moment(heute).format('DD.MM.YYYY')+" - "+moment(heute).format('HH:mm:ss'));
		return ( moment(buchTag).isBefore(heute) );
	}
	

	
	function editFreigabeClickListener(event) {
		console.log("Vermieter möchte seine Freigabe editieren");
		
		//Detail-View einblenden				
		var targetElement = event.target || event.srcElement;
		var col = $(this).parent().children().index($(this));
		var row = $(this).parent().parent().children().index($(this).parent());
		var key = col+"-"+row;
		var buchung = buchungsMap[key];
		
		if ($("#adminToolToggle").puitogglebutton('isChecked')) { 
			onAdminEdit(row,col);
			return;
		}
		
		
		var mieter_email="";
		var mieter=buchung.mieter;
		var erhalten_original = buchung.erhalten;
		var refString = '/buchungen/'+moment(workMoment).format('YYYY')+'/KW'+moment(workMoment).format('WW')+'/'+col+"-"+row;
		
		document.getElementById("gpui-ok").innerHTML= "OK";		
		document.getElementById("gpui-ok").style.display= "inline";		
		document.getElementById("gpui-cancel").innerHTML="STORNO";
		document.getElementById("gpui-cancel").style.display= "inline";	
		
								
		var inHTML="<h1>Ihre Freigabe</h1><p>Sie haben ihren Parkplatz P"+row+" für den "+getExactDate(col)+" freigegeben.</p>";
				
		var buchTag = getExactDateAsMoment(col);
		var heute = moment();
					//console.log("Moment Heute: "+ heute +" - Moment d Freigabe:"+buchTag);
					//console.log("Datum Heute: "+ moment(heute).format('DD.MM.YYYY') +" - Datum d Freigabe:"+moment(buchTag).format('DD.MM.YYYY'));
		heute=moment(heute).add(frist_tage,'days');
		//console.log("Heute +(frist_tage) : "+moment(heute).format('DD.MM.YYYY'));
		//console.log("BuchTag in Past ? : "+isInPast(buchTag));
		//console.log("BuchTag after Heute+2 ? : "+moment(buchTag).isAfter(heute));		
					
		if ( (moment(buchTag).isAfter( heute) || mieter=='null') && !isInPast(buchTag) ) {
			inHTML+="<p>Eine Stornierung der Freigabe ist möglich.</p>";
			document.getElementById("gpui-cancel").style.display="inline-block";
					//heute=moment(heute).subtract(2,'days');
		} else {		
			inHTML+="<p>Eine Stornierung der Freigabe ist nicht mehr möglich.</p>";
			document.getElementById("gpui-cancel").style.display="none";
		}			
		
		document.getElementById("gpui-ok").onclick = function () {
			var erhalten_neu = $("#cb_erhalten").prop("checked");
			console.log("erhalten ori/neu:"+erhalten_original, erhalten_neu);
			if (erhalten_neu && (erhalten_original != erhalten_neu)) {
					firebase.database().ref(refString).update({erhalten:erhalten_neu});
			}
//			document.getElementById("generic-dialog-overlay").style.display = "none";
			$("#generic-puidialog").puidialog('hide');
		}
		
		document.getElementById("gpui-cancel").onclick = function() {
			//Freigabe stornieren. 
			//Knoten löschen. Neuzeichnen der Tabelle wird von nem OnChildRemoveListener angestoßen.

			var mieterInfo=""
			if (mieter != 'null') {
				console.log("Email an Mieter senden!");
				var text = "Tut uns leid, aber ihre Buchung des P"+col+" am "+moment(buchTag).format('DD.MM.YYYY') +" wurde vom Vermieter storniert.";
				$.get( "https://us-central1-parkingtool-6cf77.cloudfunctions.net/email?to="+mieter_email+"&subject=Stornierung%20ihrer%20Buchung&text="+text, function( data ) {
					console.log("Email verschickt: "+text);
				});
			}
			firebase.database().ref(refString).remove();				
			//document.getElementById("generic-dialog-overlay").style.display = "none";
			$("#generic-puidialog").puidialog('hide');
			addMessage([{severity: 'info', summary: 'Freigabe storniert', detail: 'Ihre Freigabe wurde storniert.'}]);
		};
		
		if (mieter != 'null') {
			//Wenn ein Mieter eingetragen wurde, dessen Email anfragen und DANACH alles anzeigen.
			//Die Info, welche Email zu welcher Uid gehört, habe ich auch in admin.js geladen, AABER, ich weiß nicht ob das so bleibt!
			//Wird ja auch jedesmal einiges an traffic verursachen, gerade auf mobile sollet ich lieber die info hier anfragen!
			
			document.getElementById("generic-dialog-overlay").style.display="block";
			$.get( "https://us-central1-parkingtool-6cf77.cloudfunctions.net/getAuthInfo?uid="+mieter+"&key=email", function( data ) {	
				document.getElementById("generic-dialog-overlay").style.display="none";
				mieter_email=data;
				var subject="Parkplatz "+row+" am "+moment(buchTag).format('DD.MM.YYYY');
				inHTML+='<p>Sie erreichen den Mieter unter: '+
					'<a href="mailto:'+mieter_email+'?subject='+subject+'" target="_top">'+mieter_email+'</a></p>';
				
				console.log("Erhalten?:"+buchung.erhalten);
				console.log("bezahlt?:"+buchung.bezahlt);
				
				inHTML+='Erhalten: <input type="checkbox" id="cb_erhalten" ';			
				if (buchung.erhalten==true) { inHTML+="checked"; }
				inHTML+='></input><br></br>';
				if (buchung.bezahlt==true) { inHTML+='<p>Der Mieter hat die Buchung mit "Bezahlt" markiert.</p>'; }
		
				document.getElementById("gpui-p").innerHTML = inHTML;	
				//document.getElementById("generic-dialog-overlay").style.display = "block";	
				$("#generic-puidialog").puidialog('show');
			});
		} else {
			//Wenn kein Mieter eingetragen wurde, einfach alles anzeigen.
			document.getElementById("gpui-p").innerHTML = inHTML;	
			//document.getElementById("generic-dialog-overlay").style.display = "block";	
			$("#generic-puidialog").puidialog('show');
		}			
		
		
		
	}
	
	function isEarlyEnough() {
		//true falls noch vor der oben definieren 9:30 - Frist, false sonst.		
		var now = moment();
		var todays_frist = moment();
		todays_frist.set('hour',0);
		todays_frist.set('minute',frist_stunde);
		todays_frist.set('seconds',0);
		//console.log( "jetzt: "+moment(now).format('HH.mm.ss') + "    frist: "+moment(todays_frist).format('HH.mm.ss') );
		return now.isBefore(todays_frist);
	}
	

	function makeFreigabeClickListener(event) {
		console.log("Vermieter macht eine Freigabe");
		
		var targetElement = event.target || event.srcElement;
		var col = $(this).parent().children().index($(this));
		var row = $(this).parent().parent().children().index($(this).parent());
			
		console.log("ParkId: "+row +" / Tag:"+col);
		
		if ($("#adminToolToggle").puitogglebutton('isChecked')) { 
			onAdminEdit(row,col);
			return;
		}
		
		//Prüfen, ob der Freigabe-Trmin zeitlich passt...
		if ( isInPast (getExactDateAsMoment(col)) ) {
			addMessage([{severity: 'error', summary: 'Freigabe nicht möglich', detail: 'Der Tag liegt in der Vergangenheit.'}]);
			return;
		}
			
		if ( moment(getExactDateAsMoment(col)).isSame(moment(),'day') && !isEarlyEnough() ) {
			//ale rt("Der Parkplatz kann heute nicht mehr freigegeben werden.");
			addMessage([{severity: 'error', summary: 'Freigabe nicht möglich', detail: 'Sie können Ihren Parkplatz nur bis 9:30 Uhr freigeben.'}]);
			return;
		}
		
		var inHTML="<h1>Parkplatz freigeben</h1>"+
			"<p>Sind Sie sicher, dass Sie ihren Parkplatz P"+row+" am "+ getExactDate(col)+" freigeben wollen?</p>";
		
		if (direktVergabe) {
			//Checkt jetzt nicht, ob der Begünstigte an dem Tag vielleicht schon nen P gemietet hat...
			inHTML+="<p>Kollegen zur Direktvergabe wählen:</p>"+
			'<select id="select_direkt"><option value="null">Keine Direktvergabe</option>';
			var keys = Object.keys(emailToRoleData);
			for (var i in keys) {
				var data = emailToRoleData[keys[i]];
				var email  = keys[i].replace(/!/g,'.');
				//Um seinen Kollegen auszuwählen, ist die Email-Adresse eher nicht so toll, besser wäre der Name
				if (data.parkId == 'null') {					
					inHTML+='<option value="'+data.uid+'">'+email +'</option>';
				}
			}
			inHTML+="</select></p>";
		}
			
			
		document.getElementById("gpui-ok").innerHTML= "FREIGEBEN";		
		document.getElementById("gpui-ok").style.display= "inline";		
		document.getElementById("gpui-cancel").innerHTML="ABBRUCH";
		document.getElementById("gpui-cancel").style.display= "inline";		
		
		//document.getElementById("gdo-p").innerHTML = inHTML;
		document.getElementById("gpui-p").innerHTML = inHTML;
		$('#generic-puidialog').puidialog('show');
		
		
		var mom = workMoment.clone();
		document.getElementById("gpui-ok").onclick = function () {	
				var jahr = moment(mom).format('YYYY');
				var kw = moment(mom).format('WW');
				console.log("Freigegeben wird Parkplatz "+row + " an Tag "+col + " in Jahr "+jahr+" in KW "+kw);
				var refString = '/buchungen/'+jahr+'/KW'+kw+'/'+col+"-"+row;
				console.log("refString: "+refString);
				var mieter="null";
				if (direktVergabe) {
					//muss noch ne prüfung rein, ob der begünstigte nichtt schon nen P hat, 
					//statt 'null' tragen wir da jetzt den Begünstigten aus dem Select-Element ein.
					mieter = $("#select_direkt").find(":selected").val() ;
					//Falls .val != null kann auch ne Email verschickt werden
				}
				//Gibt's für .set eigentlich kein .then , sodass ich erfolg/fail unterscheiden und kommunizieren kann?
				firebase.database().ref(refString).set({vermieter: userId, bezahlt: 'false', erhalten: 'false', mieter: mieter});
				$("#generic-puidialog").puidialog('hide');
			}
		document.getElementById("gpui-cancel").onclick = function() {
				$("#generic-puidialog").puidialog('hide');
			};
		//document.getElementById("generic-dialog-overlay").style.display = "block";	
    }

	function getExactDate(day) {
		//Bekommt eine Spalten-nummer übergeben und baut daraus und dem aktuellen WorkMoment
		//ein Moment-Objekt und gibt das als Datums-String zurück.
		var dayOfWeekAktuell = parseInt(workMoment.day());		
		var mom = workMoment.clone();
		mom.subtract(dayOfWeekAktuell, 'days');
		mom.add(day, 'days');
		return moment(mom).format('DD.MM.YYYY');
	}
	function getExactDateAsMoment(day) {
		//Bekommt eine Spalten-nummer übergeben und baut daraus und dem aktuellen WorkMoment
		//ein Moment-Objekt.
		var dayOfWeekAktuell = parseInt(workMoment.day());		
		var mom = workMoment.clone();
		mom.subtract(dayOfWeekAktuell, 'days');
		mom.add(day, 'days');
		return mom;
	}	

		//Sucht zu ner UserId den angegebenen Wert (zb email, uid, displayName, halt die ganzen Keys des userRecord-Objeklts)
		//Später mal schauen, ob und wo das noch genutzt wird, gut Möglich, dass das überflüssig wird seitdem ich in admin.js diese EmailToRole anlege		
		var getAuthInfo = function (uid, key) {
			var dfd = $.Deferred();			
			
			setTimeout(function () {
				//
				$.get( "https://us-central1-parkingtool-6cf77.cloudfunctions.net/getAuthInfo?uid="+uid+"&key="+key, function( data ) {
					var ergebnis = {uid: uid, key: key, data: data};
					console.log("Antwort von Auth: "+Object.keys(ergebnis));	
					//document.getElementById("tdUid_"+uid).html=data;					
					//Kann ich data um die uid erweitern?
					dfd.resolve(ergebnis);
				});
			}, 0);			
			return dfd.promise();			
		}
		
		//testEmail - nur für debugger
		function testEmail() {
			console.log("testEmail");
			$.get( "https://us-central1-parkingtool-6cf77.cloudfunctions.net/testEmail", function( data ) {
				console.log("Antwort von testEmail: "+data);
				return data;
			});
		}	
		
	
		function login() {
		//Übernimmt die Daten aus den eingabefeldern. Falls die leer: dieser 123Abc - User
			var email=$("#login_email").val();
			if (email=="") {email='123@abc.de';}
			var password=$("#login_pw").val();
			if (password=="") {password='AbcGuy123';}
			
            console.log("Login mit "+email+" / "+password+"...");
			
            firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
				// Handle Errors here.
				
				var errorCode = error.code;
				
				loginStatus =error.message;
				
				console.log("eeorocode, loginstatus:"+errorCode, loginStatus);
				
				var appElement = document.querySelector('[ng-app=myLogin]');
				var $scope = angular.element(appElement).scope();
				$scope.$apply(function() {
					$scope.sls=loginStatus;
				});
				
				
			});
        }
		
		function register() {
		//soll eigentlich die daten aus den eingabefeldern üebrnehmen
			//var email=$("#user_email").val();
			var email=$("#login_email").val();
			//var password=$("#user_password").val();
			var password=$("#login_pw").val();
            console.log("Register mit "+email+" / "+password+"...");    
			firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
			  // Handle Errors here.
			  var errorCode = error.code;
			  var errorMessage = error.message;
			  // ...
			});			
        }
		
		function getRole() {
			//Das dauert auch zu lange, lieber von EmailToRoleData beziehen oder ghleich hintendran klatschen.
			console.log("GetRolle: " + "https://us-central1-parkingtool-6cf77.cloudfunctions.net/getRole?email="+emailAsKey);
			$.get( "https://us-central1-parkingtool-6cf77.cloudfunctions.net/getRole?email="+emailAsKey, function( data ) {						
				//Um die Rolle als Mieter festzulegen, muss ich als parkId 'null' eintragen. (Oder wasimmer ich hinterher prüfe)
				var lineBreak = parseInt(data.indexOf("\n"));
				var parkId = data.slice(0,lineBreak);
				admin = data.slice((parseInt(lineBreak)+1),data.length);
				
				if (admin=='true') {
					var adminButton=document.getElementsByClassName('dropdown');					
					adminButton[0].style.display= "inline-block";
					document.getElementById("adminToolToggle").style.display="block-inline";
				}
				console.log("=> ("+parkId+"), ("+admin+")");
				var rolle="Mieter";
				if (parkId != 'null') {	  				  
				  userParkId=parseInt(parkId);
				  rolle = "Vermieter, P:"+userParkId;
				}
				$("#status").text("Eingeloggt als:\n"+rolle);				
				generateTable();
			});
        }

		//kann später auch weg
		function closeLoginDlg() {
	$('#login-dlg').puidialog('hide');
	$('#generic-puidialog').puidialog('show');
}

		//Hier schmeiß ich jetzt die Buchungen Funktion rein.
		function nodeCode() {
			//Was muss geschehen: Eigentlich dasselbe wie ne Admin-Anfrage zu nem konkreten User. Nur anders dargestellt
			//mit der Option, künftige Freigaben zu stornieren und Bezahlt/Erhalten zu editieren.
			//Und: Er muss auch über Jahres-Knoten iterieren
			//Darstellung ist mit Unter-Akkordeons in Jahr>KW>detail
			
			//Die Funktion läuft natürlich aber aufm Server, sonst zuviel Traffic
			var buchungenMap = {};
			
			//Er rattert jetzt über alle KW aller Jahre und speichert Buchungen, in denen der User als Mieter oder Vermieter auftaucht in ein Array. Oder ne Map.
			firebase.database().ref('/buchungen/').once('value').then(function (snapshot) {
				var year_keys = Object.keys(snapshot.val());				
				for (var year in year_keys) {					
					var week_keys = Object.keys(snapshot.val()[year_keys[year]]);					
					for (var week in week_keys) {						
						var freigaben_keys = Object.keys(snapshot.val()[year_keys[year]][week_keys[week]] );
						for (var freigabe in freigaben_keys) {							
							var buchung = snapshot.val()[year_keys[year]][week_keys[week]][freigaben_keys[freigabe]];							
							if (userId == buchung.vermieter || userId == buchung.mieter)
							{	//Buchung in die Map packen
								var mapKey = year_keys[year]+"/"+week_keys[week]+"/"+freigaben_keys[freigabe];
								buchungenMap[mapKey] = buchung;								
							}
						}							
					}
				}
				console.log (buchungenMap);
				
			});
			
			// So hier wären wir dann vom Server zurück, obwohl der wohl keine Map zurückliefern wird.
			// Dann kann ich jetzt hier mal schauen, in welcher orm ich die Antwort am schlauesten stricke...
			
			
		}	
		
		function wocheVor() {
			workMoment.add(7,'days');
			buchungRefNeu.off('value', buchungListener);
			buchungRefNeu.off('child_removed', childRemoveListener);
			generateTable();					
		}
		
		function wocheZurueck() {
			workMoment.subtract(7,'days');
			buchungRefNeu.off('value', buchungListener);
			buchungRefNeu.off('child_removed', childRemoveListener);
			generateTable();					
		}
		
		function generateTable() {
			console.log ("Generate Table...");
			kalenderWoche = moment(workMoment).format('WW');
			$("#KalenderWoche").text("KW "+kalenderWoche);
			var dayOfWeekAktuell = workMoment.day();
			//mom= das kann verändert werden, workMoment muss integrität wahren
			var mom = workMoment.clone();
			var firstDayOfWeek = moment(mom.subtract((parseInt(dayOfWeekAktuell)-1), 'days')).format('DD.MM.YYYY');
			var lastDayOfWeek = moment(mom.subtract(mom.add(4, 'days'))).format('DD.MM.YYYY'); 
			$("#kw-daten").text(firstDayOfWeek + " - "+lastDayOfWeek);
            // Tabelle erzeugen. 
            var inHTML="<tr><th>Parkplatz</th><th>Montag</th><th>Dienstag</th><th>Mittwoch</th><th>Donnerstag</th><th>Freitag</th></tr>";
            
			if (true) { //!minimiert || (!buchungsMap)) {
				//Normale Darstellung, sätmliche Zeilen
				for (var p=1; p<=anzahl_parkplaetze; p++) {
					//An jede Zelle nen Listener für ne Funktion, die nur ausgeführt wird, wenn User=Admin!
					inHTML+="<tr><td id='parkplatzslot'>"+p+"</td>" +
                    "<td id='blankslot' onclick='onAdminEdit("+p+",1)'></td>" +
                    "<td id='blankslot' onclick='onAdminEdit("+p+",2)'></td>" +
                    "<td id='blankslot' onclick='onAdminEdit("+p+",3)'></td>" +
                    "<td id='blankslot' onclick='onAdminEdit("+p+",4)'></td>" +
                    "<td id='blankslot' onclick='onAdminEdit("+p+",5)'></td></tr>";				
				}	
			} else {
				//Minimierte Darstellung, nur die Zeilen, in denen ne Buchung steht. (Und die eigene, falls Vermieter)
				//Über die BuchungsMap gehen und für jeden Parkplatz (der nicht bereits drin ist) eine Zeile erzeugen. Die Zeile der eigenen ParkId, auch wenn nix
				//freigegeben wurde, muss an die richtige STelle eingefügt werden. (Prüfen, ob eingelesene ParkId>UserParkId, dann halt schnell eigene Zeile rein)... 
				//Auch dran denken, dass sämtliche Klick-Listener im Falle dass minimiert wurde, ihre Zelle nicht mehr üebr Row rausfinden
				//können sondern über den Text der ersten Spalte.
				
				
				//Warum geb ich den Onklick listener mitsamt seinen passenden Parametern nicht im HTML an? zB 
				for (var i in buchungsMap) {
					
					// Wenn Buchung vorhanden oder wenn ParkPlatzNUmmer die eigene: Reihe hinzu
					console.log("buchung: "+i);
					//var d= data[i];
						//console.log("d:"+d);
						//var j = d.indexOf('-');
					var parkId = i.slice(2,i.length);
					inHTML+="<tr><td id='parkplatzslot'>"+parkId+"</td>" +
					"<td id='blankslot'></td>" +
					"<td id='blankslot'></td>" +
					"<td id='blankslot'></td>" +
					"<td id='blankslot'></td>" +
					"<td id='blankslot'></td></tr>";					
				}
				
            }
			
            //$("[name=cell_1-1]").on("contextmenu", onAdminToggle(this) );
			$("#dynamicTable").on("contextmenu", onAdminToggle(this) );
            $("table#dynamicTable").html(inHTML);
			/*document.getElementById('dynamicTable').onclick = function(event) {
				console.log("Auf Tablle geklickt");
				var targetElement = event.target || event.srcElement;
				var col = $(this).parent().children().index($(this));
				var row = $(this).parent().parent().children().index($(this).parent());
				console.log(col,row);
			}*/
			

			
			//Falls Vermieter: Dessen Zeile einfärben und Listener ran. Falls minimiert: Passende Zeile über den Text der Zeile rausfinden (=ParkId)
			
			if (userParkId != 'null') {		
				var table = document.getElementById("dynamicTable");			
				for (var spalte=0;spalte<=5;spalte++) {				  
					if (table.rows[userParkId].cells[spalte].id == 'blankslot') {					
						table.rows[userParkId].cells[spalte].id = 'blankuserslot';
						table.rows[userParkId].cells[spalte].addEventListener("click", makeFreigabeClickListener);
					}
				}
			}
			
			

			var refString = 'buchungen/'+moment(workMoment).format('YYYY')+'/KW'+kalenderWoche+'/';
			//console.log("Buchungs-Listener umbiegen auf: "+refString);
			buchungRefNeu =  firebase.database().ref(refString);
			buchungRefNeu.on('value', buchungListener);
			buchungRefNeu.on('child_removed', childRemoveListener);
		}
		
        $(document).ready(function(){
			$("#loginButton").click(login);
			$("#registerButton").click(register);
			$("#roleButton").click(getRole);
			$("#wocheZurueckButton").click(wocheZurueck);
			$("#wocheVorButton").click(wocheVor);
			$("[name=user2RoleView]").hide();
			$("[name=buchungenView]").hide();
			$("[name=kalenderView]").hide();
			$("[name=auswertungView]").hide();
        });


function showKalender() {	
	$("[name=buchungenView]").hide();
	$("[name=user2RoleView]").hide();
	$("[name=kalenderView]").show();
}


function onAdminToggle(cb) {
	//console.log("Parkplatz: "+p+", Tag:"+col);
	console.log("admin chekced:"+cb.checked);
	adminEditingMode = $("#adminToolToggle").puitogglebutton('isChecked');
}

function onMinimizeToggle(cb) {
	//adminEditingMode = $("#adminToolToggle").puitogglebutton('isChecked');
}