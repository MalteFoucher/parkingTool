function showBuchungen() {
	$("[name=kalenderView]").hide();
	$("[name=user2RoleView]").hide();
	$("[name=auswertungView]").hide();
	$("[name=buchungenView]").show();
	
	var buchungenMap = {};
	var year_map={};
	var inHTML="";
		
	
	//Er rattert jetzt über alle KW aller Jahre und speichert Buchungen, in denen der User als Mieter oder Vermieter auftaucht in ein Array. Oder ne Map.
	//Wäre aber besser, wenn nur solche Einträge übernommen werden, wo es auch einen Mieter gibt. Andere sind irrelevant, oder?
	firebase.database().ref('/buchungen/').once('value').then(function (snapshot) {
		var year_keys = Object.keys(snapshot.val());				
		for (var year in year_keys) {
			var week_keys = Object.keys(snapshot.val()[year_keys[year]]);
			buchungenMap={};		
			for (var week in week_keys) {						
				var freigaben_keys = Object.keys(snapshot.val()[year_keys[year]][week_keys[week]] );
				for (var freigabe in freigaben_keys) {							
					var buchung = snapshot.val()[year_keys[year]][week_keys[week]][freigaben_keys[freigabe]];							
					if (userId == buchung.vermieter || userId == buchung.mieter)
					{	//Buchung in die Map packen						
						var mapKey = week_keys[week]+"/"+freigaben_keys[freigabe];
						//buchungenMap[year_keys[year]]=mapKey;
						buchungenMap[mapKey]= buchung;
						//mockResponse+=mapKey+"/"+buchung.vermieter+"/"+buchung.mieter+"/"+buchung.bezahlt+"/"+buchung.erhalten+"/";								
					}
				}							
			}
			year_map[year_keys[year]]=buchungenMap;
		}
		
		//Map fertig gemappt
		
		var res_keys = Object.keys(year_map);
		console.log ("Year-Map: "+res_keys);
		for (var i in res_keys) {
			//inHTML += '<button onclick=\"togglePanel(\'panel_'+res_keys[i]+'\')" class="accordion" id="button_'+res_keys[i]+'">'+res_keys[i]+'</button>'+
			//'<div class="panelHide" id="panel_'+res_keys[i]+'">';
			var jahr = res_keys[i];
			inHTML += "<h2>"+jahr+"</h2> <div id=acc"+jahr+">";
			var buchung_keys = Object.keys(year_map[res_keys[i]]);
			var j = 0;
			for (var j in buchung_keys) {
				var buchung = year_map[res_keys[i]][buchung_keys[j]];
				var partner;
				var checkb;
				inHTML+="<h3>";
				
				if (userId == buchung.vermieter) {
					inHTML+="Vermietung";
					partner = "Mieter: "+getEmailToUid(buchung.mieter);
					//Oh leck, wie komm ich denn später im Listener von der Checkbox zum original Datenbank-Eintrag ???
					checkb = '<input type="checkbox" ';
					if (buchung.erhalten) {
						checkb+="checked";
					}
					checkb+='>Zahlung erhalten</input>';
				} else {
					inHTML+="Buchung";
					partner = "Vermieter: "+getEmailToUid(buchung.vermieter);
					checkb = '<input type="checkbox" ';
					if (buchung.bezahlt) {
						checkb+="checked";
					}
					checkb+='>Bezahlt</input>';
				}
				inHTML+=" am "+getDateToKey(jahr, buchung_keys[j])+"</h3> <div>";				
				inHTML+="<p>"+partner+"</p><p>"+checkb+"</p>";
				inHTML+="</div>";
			}
			inHTML+="</div>";
			//console.log (res_keys[i]+": "+year_map[res_keys[i]] );
			//console.log ("  -> "+Object.keys(year_map[res_keys[i]]) );
		}
		console.log("inHTML: "+inHTML);
				//console.log (mockResponse);
				//var tokenArray = mockResponse.split("/");
			
			//HTML aufzubauen wird jetzt bissel komplizierter: Einmal ein Akkordeon für die Jahreszahl. Dann für die KW, dann für jede Freigabe/Buchung.
			//Oder besser: Jahreszahl -> Datum (aus KW und Datum)
			
			
			// So hier wären wir dann vom Server zurück, obwohl der wohl keine Map zurückliefern wird.
			// Dann kann ich jetzt hier mal schauen, in welcher orm ich die Antwort am schlauesten stricke...
			
			//..ich brauche Mieter/Vermieter, Datum, bezahlt/erhalten... eigentlich alles. Also für jeden Eintrag
			//Year,KW,Park_Tag -> daraus Datum basteln
			//,Vermieter,Mieter,Bezahlt,Erhalten.
			
			
			
		$("#userBuchungen").html(inHTML);
		//Da mehrere divs mit unterschiedlichen ids gebaut werden müssen, brauchen wir nen regex um die alle zu puiaccordions zu machen.
		$('div').filter(function() {
			return this.id.match(/acc/);
		}).puiaccordion();		

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