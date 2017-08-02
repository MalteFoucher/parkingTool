function showBuchungen() {
	$("[name=kalenderView]").hide();
	$("[name=user2RoleView]").hide();
	$("[name=auswertungView]").hide();
	$("[name=buchungenView]").show();
	
	//var buchungenMap = {};
	//var year_map={};
	var inHTML="";
		
	
	//Er rattert jetzt über alle KW aller Jahre und speichert Buchungen, in denen der User als Mieter oder Vermieter auftaucht in ein Array. Oder ne Map.
	
	var responseString = "";
	firebase.database().ref('/buchungen/').once('value').then(function (snapshot) {		
		var year_keys = Object.keys(snapshot.val());				
		console.log("Listener auf Buchgungen von showBuchungen(): "+year_keys);
		for (var year in year_keys) {
			var week_keys = Object.keys(snapshot.val()[year_keys[year]]);
			//buchungenMap={};		
			for (var week in week_keys) {						
				var freigaben_keys = Object.keys(snapshot.val()[year_keys[year]][week_keys[week]] );
				for (var freigabe in freigaben_keys) {							
					var buchung = snapshot.val()[year_keys[year]][week_keys[week]][freigaben_keys[freigabe]];							
					//var buchung = {vermieter: original_buchung.vermieter, mieter: original_buchung.mieter
					
					//buchung.refString = refString;
					
					if (userId == buchung.vermieter || userId == buchung.mieter)
					{	var refString = year_keys[year]+"/"+week_keys[week]+"/"+freigaben_keys[freigabe];
						console.log ("RefString: "+refString);
						responseString+=refString+"/";
						//var mapKey = week_keys[week]+"/"+freigaben_keys[freigabe];
						//buchungenMap[year_keys[year]]=mapKey;
						//buchungenMap[mapKey]= buchung;
						responseString+=buchung.vermieter+"/"+buchung.mieter+"/"+buchung.bezahlt+"/"+buchung.erhalten+"/";								
					}
				}							
			}
			//year_map[year_keys[year]]=buchungenMap;
		}
		console.log("Response:\n"+responseString);
		
		var responseTokens = responseString.split("/");
		
		console.log("ResponseToken.length: "+responseTokens.length + " /7 => "+ (responseTokens.length/7)+" Buchungen");
		
		var buchungenMap = {};
		var year_map = {};
		for (var i = 0; i< responseTokens.length-7 ; i+=7) {
			
			//Gucken, ob für das gelesene Jahr schon ein Eintrag in der BuchungMap steht
			var year = responseTokens[i];
			if (!(year in buchungenMap)) {
				//Neuen Eintrag für das aktuelle Jahr in year_map anlegen
				console.log("Year "+year+" was not yet in buchungenMap!");
				buchungenMap[year] = {}
			}
			
			/*console.log("i:"+i);
			console.log("Year:"+responseTokens[i]);
			console.log("KW:"+responseTokens[i+1]);
			console.log("parkTag:"+responseTokens[i+2]);
			console.log("vermieter:"+responseTokens[i+3]);
			console.log("mieter:"+responseTokens[i+4]);
			console.log("bezahlt:"+responseTokens[i+5]);
			console.log("erhalten:"+responseTokens[i+6]);*/
			var buchung_key = responseTokens[i+1]+"/"+responseTokens[i+2];
			var value = {vermieter: responseTokens[i+3], mieter: responseTokens[i+4], bezahlt: responseTokens[i+5], erhalten: responseTokens[i+6]};
			buchungenMap[year][buchung_key] = value;

		}
		console.log (Object.keys(buchungenMap));
		year_keys = Object.keys(buchungenMap);
		console.log (Object.keys(buchungenMap[year_keys[0]]));
		
		//Jetzt sind die Buchungen schön nach Jahren sortiert.
		console.log("YKL:"+year_keys.length);
		//for (var i=year_keys.length; i>=0 ;i--) {			
		for (i in year_keys) {			
			var jahr = year_keys[i];
			inHTML += "<h2>"+jahr+"</h2> <div id=acc"+jahr+">";
			var buchung_keys = Object.keys(buchungenMap[year_keys[i]]);
			 
			for (var j in buchung_keys) {
				var buchung = buchungenMap[year_keys[i]][buchung_keys[j]];
				var partner;
				var checkb;
				var mailto;
				var subject = "SuBjeCt";
				inHTML+="<h3>";
				
				if (userId == buchung.vermieter) {
					
					if (buchung.mieter =='null') {
						inHTML+="Freigabe";
					} else {
						inHTML += "Vermietung";
					}
					partner = "Mieter: ";
					mailto = getEmailToUid(buchung.mieter);					
					
					//Oh leck, wie komm ich denn später im Listener von der Checkbox zum original Datenbank-Eintrag ??? über buchung.refString
					//Listener an die Checkbox hängen. 
					checkb = '<input type="checkbox" id="cb_buchung_'+buchung.refString+'" ';
					if (buchung.erhalten) {
						checkb+="checked";
					}
					checkb+='>Zahlung erhalten</input>';
				} else {
					inHTML+="Buchung";
					partner = "Vermieter: ";
					mailto = getEmailToUid(buchung.vermieter);
					checkb = '<input type="checkbox id="cb_buchung_'+buchung.refString+'" ';
					if (buchung.bezahlt) {
						checkb+="checked";
					}
					checkb+='>Bezahlt</input>';
				}
				inHTML+=" am "+getDateToKey(jahr, buchung_keys[j])+"</h3> <div>";				
				inHTML+="<p>"+partner;
				console.log ("Mailto:"+mailto);
				if (mailto == 'Niemand') {
					inHTML+=mailto;
				} else {					
					inHTML+='<a href="mailto:'+mailto+'?subject='+subject+'" target="_top">'+mailto+'</a>';
				}
				inHTML+="</p><p>"+checkb+"</p>";//<p> STORNO ?? </p>"; Storno sollen die Leute im Kalender machen!
				inHTML+="</div>";
			}
			inHTML+="</div>"; 
		}
		
		console.log("inHTML: "+inHTML);
		$("#userBuchungen").html(inHTML);
				
		$('input').filter(function() {			
			return this.id.match(/_buchung_/);
		}).change( function() {	
			console.log ( this.id+": "+$(this).is(':checked') );
			//Genau genomen soll hier natürlich ein Update der geänderten Info(erhalten/bezahlt) folgen.
			//Wäre schön, wenn ich diese (oder besser gesagt: eine) BuchungMap weiterhin haben könnte, wo die originaldaten drin sind,
			//und ich über den refSring (als Key) daran komme und das dann wegspeicher.
		});
		
		
		
		//Da mehrere divs mit unterschiedlichen ids gebaut werden müssen, brauchen wir nen regex um die alle zu puiaccordions zu machen.
		$('div').filter(function() {
			return this.id.match(/acc/);
		}).puiaccordion();		
		
		/*$('input').change( function() {
			console.log ( "FUCK!"+this.id);
		});
		*/
	});
}

function getDateToKey(jahr, key) {
	//Key auseinander pflücken wird nervig
	console.log (jahr, key+":");
	var datum_moment = moment().year(jahr);
	console.log("   Jahr:"+jahr);
	console.log("       :	=> "+datum_moment.format('DD.MM.YYYY'));
	datum_moment = datum_moment.week( key.substr(2,2) );				
	console.log("   Woche:"+key.substr(2,2));
	console.log("       :	=> "+datum_moment.format('DD.MM.YYYY'));
	datum_moment = moment(datum_moment).day( key.substr(5,1) );
	console.log("   Tag:"+key.substr(5,1));
	console.log("       :	=> "+datum_moment.format('DD.MM.YYYY'));
	
	return datum_moment.format('DD.MM.YYYY');
}