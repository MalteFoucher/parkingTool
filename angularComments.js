// AngularJS specific code
function commentControl($scope)
{
    $scope.commentator = function()
    {
        var result = $scope.yourName;
        if (!$scope.yourName)
        {
            result = "Anonymous";
        }
        if ($scope.website)
        {
            result += " (" + $scope.website + ")";
        }
        return result;
    };
    $scope.commentPreview = function()
    {
        var result = $scope.comment;
        if (!$scope.comment)
        {
            result = "Nothing yet.";
        }
        return result;
    };
    $scope.previewVisible = function()
    {
        if (!$scope.yourName)
            if (!$scope.website)
                if (!$scope.comment)
                    return "none";
        return "block";
    }
	
	$scope.adminStatus= function()
	{
		return adminEditingMode;
	}
}
 
// Primefaces specific code
// decorate the comment form's input fields
$(function()
{
    $('#in').puiinputtext();
    $('#commentatorsNameID').puiinputtext();
    $('#commentatorsWebSiteID').puiinputtext();
    $('#commentID').puiinputtextarea({
        counter : $('#restZeichenID'),
        counterTemplate : '{0} characters remaining.',
        maxlength : 1000
    });
});
 
// define the comment dialog
$(function()
{
    $('#dlg').puidialog({
        showEffect : 'fade',
        hideEffect : 'fade',
        minimizable : true,
        maximizable : true,
        width       : 600,
        modal : true,
        location : 'top',
        buttons : [ {
            text : 'Submit',
            icon : 'ui-icon-check',
            click : function()
            {
                $('#dlg').puidialog('hide');
            }
        }, {
            text : 'Forget about my comment',
            icon : 'ui-icon-close',
            click : function()
            {
                $('#dlg').puidialog('hide');
            }
        } ]
    });
});

// define the login dialog
$(function()
{
    $('#login-dlg').puidialog({
        showEffect : 'fade',
        hideEffect : 'fade',
        minimizable : true,
        maximizable : true,
        width       : 600,
        modal : true,
		responsive : true,
        location : 'center',
        buttons : [ {
            text : 'Login',
            //icon : 'ui-icon-check',
            click : function()
            {
                //$('#login-dlg').puidialog('hide');
				login();
            }
        }, {
            text : 'Register',
            //icon : 'ui-icon-close',
            click : function()
            {
                //$('#login-dlg').innerHTML="<p>Hey!</p>";
				//document.getElementById('login-dlg').innerHTML = "<p>Hey!</p><br><button onclick='closeLoginDlg()'>Klick mich!</button>";
				//var msg = [{severity: 'info', summary: 'Message Title', detail: 'Message Detail here.'}];
				//$('#default').puigrowl('show', msg);
				register();
				
            }
        } ]
    });
});

// decorate the button opening the comments dialog
$(function()
{
    $('#btn-show').puibutton({
        icon : 'ui-icon-arrow-4-diag',
        click : function()
        {
            $('#login-dlg').puidialog('show');
        }
    });
});
// define the generic dialog-overlay dialog
$(function()
{
    $('#generic-puidialog').puidialog({
        showEffect : 'fade',
        hideEffect : 'fade',
        minimizable : true,
        maximizable : false,
        width       : 600,
        modal : true,
		responsive : true,
        location : 'center'	,
		resizable: 'false'
    });
});

function loginControl($scope, $window) {
	console.log("loginControl: ");
	$scope.sls = function() {
		//$window.loginStatus;
		return "Hey na!";
	}
	//$scope.wert = $("#adminToolToggle").puitoggleButton('isChecked');
}

function dialogControl($scope, $window) {
	//$scope.sls = $window.loginStatus;
}

$(function()
{
	$('#default').puigrowl();
	$('#dacc2017').puiaccordion();
//	$('#defaultAcc2').puiaccordion();
	//Alle div container mit ner id *acc* werden zu accordions
	



	$('#adminToolToggle').puitogglebutton({
		onLabel: 'Admin Mode on',
		offLabel: 'Admin Mode off',
        onIcon: 'fa-check-square',
        offIcon: 'fa-square'
	});
	$('#minimizeToggle').puitogglebutton({
		onLabel: 'Zeilen minimiert',
		offLabel: 'Zeilen maximiert',
        onIcon: 'fa-check-square',
        offIcon: 'fa-square'
	});
	
	//$('#adminToolToggle').puiswitch();
	
    //$('#doc').puitabview();
 
    $('#btn-info').puibutton().click(function() {
        addMessage([{severity: 'info', summary: 'Message Title', detail: 'Message Detail here.'}]);
    });
	
	addMessage = function(msg) {
        $('#default').puigrowl('show', msg);
    };

	//$('#login_pw').puipassword(); Wäre beim Registrieren cool, beim Login ziemlich doof
	//$('button').puibutton();
	
 


});