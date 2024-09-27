﻿var uploadMasters1_dtObj;
$(document).on('click', '#domainUser', function () {
    GetUserNames();
});


function GetUserNames() {
    ////
    if (uploadMasters1_dtObj != undefined) {
        uploadMasters1_dtObj.destroy();
    }
    var i = 0;
    uploadMasters1_dtObj = $('#userTable').DataTable({

        createdRow: function (row, data, dataIndex) {
            // Set the data-status attribute, and add a class
            $(row).find('td:eq(4) a')
                .attr('data-userName', data.UserName)
                .addClass('userName');
            $(row).find('td:eq(0)')
               .html(i++)
            $(row).find('td:eq(2) img')
           .attr('data-userNameToEdit', data.UserName)
            $(row).find('td:eq(2) img')
         .attr('data-userRoleName', data.RoleName)


           

        },



        "ajax": {
            "url":'/Security/AjaxGetUserName',
            "type": "GET",
            "error": function (xhr, textStatus, errorThrown) {
                callOnError(xhr, textStatus, errorThrown);
            },
            complete: function () {
                $('a[data-userName="Admin"]').css("pointer-events", "none");
                $('a[data-userName="Admin"] span').removeClass("glyphicon glyphicon-trash text-danger");

                
            }
            

        },
        "columns": [
                             { "defaultContent": i++ },
                            { "data": "UserName", "orderable": true },
                             { "defaultContent": '<a href="#" class="process-link" id="selectrole" data-toggle="modal" data-target="#mdSelectRole"><img id="editUserRole" src="/img/icons/role.png" alt="" class="w30"></a>' },
                            { "data": "RoleName", "orderable": true },
                           
                            { "defaultContent": '<a  href=#><span class="glyphicon glyphicon-trash text-danger"></span> </a>' },


        ],
    //     <td class="text-center"><a href="#" class="process-link" id="selectrole" data-toggle="modal" data-target="#mdSelectRole">

    //<img src="img/icons/role.svg" alt="" class="w30"></a></td>

       
        "scrollX": true,
        "scrollY": 400,
        "scroller": {
            loadingIndicator: true
        }
    })
  


}
$('#saveUserName').click(function () {
    ////
    if ($('#createUserInput').val() == "") {
        bootbox.alert("Please enter a User Name")
        return false;
    }
    $.ajax({

        type: 'GET',
        url: '/Security/AjaxCreateUserName',
        data: {
            userName: $('#createUserInput').val(),
            isLocalUser: $("#domainUser").data("islocaluser")

        },
        cache: false,
        success: function (data) {
            $('#createUserInput').val("");
            bootbox.alert(data.data);

            GetUserNames();

        }

    });


});

$(document).on('click', 'a.userName', function () {
    ////
    var p = "<p>Are you sure.you want to Delete:</p><p style='color:darkorange;'></p><input id='userNamesToDelete' type='hidden' value='" + $(this).attr('data-userName') + "' />";

    $("#confirmModalUser div.modal-body").html(p);

    $('#confirmModalUser').modal('show');


});
$(document).off("click", "#btnDeletUser").on("click", "#btnDeleteUser", function () {


    $('#confirmModalUser').modal('hide');
    $.ajax({
        type: 'POST',
        url: '/Security/AjaxDeleteUserName',
        data: {
            userName: $('#userNamesToDelete').val(),
        },
        cache: false,
        success: function (data) {
            bootbox.alert(data.data);

            GetUserNames();
        }

    })

});





function GetRoleNames() {
    ////
    if (uploadMasters1_dtObj != undefined) {
        uploadMasters1_dtObj.destroy();
    }
    var i = 0;
    uploadMasters1_dtObj = $('#roleTable').DataTable({
       
        createdRow: function( row, data, dataIndex ) {
            // Set the data-status attribute, and add a class
            $( row ).find('td:eq(2) a')
                .attr('data-roleName', data.RoleName)
                .addClass('roleName');
            $(row).find('td:eq(0)')
               .html(i++)
           
        },
        
        
        "ajax": {
            "url": '/Security/AjaxGetRoleName',
            "type": "GET",
            complete: function () {
                $('a[data-roleName="Admin"]').css("pointer-events", "none");
                $('a[data-roleName="Admin"] span').removeClass("glyphicon glyphicon-trash text-danger");


            },
            "error": function (xhr, textStatus, errorThrown) {
                callOnError(xhr, textStatus, errorThrown);
            }
            //"datatype": "json"

        },
        "columns": [
                             { "defaultContent": i++ },
                            { "data": "RoleName", "orderable": true},                          
                            { "defaultContent": '<a  href=#><span class="glyphicon glyphicon-trash text-danger"></span> </a>' },


        ],
        

        "scrollX": true,
        "scrollY": 150,
        "scroller": {
            loadingIndicator: true
        }
    })
   
       
  
}


$('#saveRoleName').click(function () {
    ////
    if ($('#createRoleInput').val() == "") {
        bootbox.alert("Please enter a Role Name")
        return false;
    }
    $.ajax({

        type: 'GET',
        url: '/Security/AjaxCreateRoleName',
        data: {
            roleName: $('#createRoleInput').val(),


        },
        cache: false,
        success: function (data) {
            $('#createRoleInput').val("");
            bootbox.alert(data.data);

            GetRoleNames();

        }

    });


});

$(document).on('click', 'a.roleName', function () {
    ////
    var p = "<p>Are you sure.you want to Delete:</p><p style='color:darkorange;'></p><input id='roleNamesToDelete' type='hidden' value='" + $(this).attr('data-roleName') + "' />";

    $("#confirmModal div.modal-body").html(p);

    $('#confirmModal').modal('show');


});
$(document).off("click", "#btnDelete").on("click", "#btnDelete", function () {
    $('#confirmModal').modal('hide');
    $.ajax({
        type: 'POST',
        url: '/Security/AjaxDeleteRoleName',
        data: {
            roleName: $('#roleNamesToDelete').val(),
        },
        cache: false,
        success: function (data) {
            bootbox.alert(data.data);

            GetRoleNames();
        }

    })

});




$(document).on('click', '#editUserRole', function () {
    var trHTML = '';
    //
    var username = $(this).attr('data-userNameToEdit');
    $('#saveUserRoleName').attr('data-userName', username);
    var rolename = $(this).attr('data-userRoleName');
    //$('#saveUserRoleName').attr('data-roleName', rolename);
    $.ajax({
        type: 'get',
        url: '/Security/AjaxGetRoleName',
        success: function (data) {
            console.log(data.data);
          
            $.each(data.data, function (i, item) {
                
                trHTML += '<li value="'+ data.data[i].RoleName  +'" class="list-group-item">' + data.data[i].RoleName + '</li>';

            });

            $('#selectedUserRole').html(trHTML);
            

        },
        complete: function () {
            if (rolename != 'null')
            {
               // actives = $('.list-left ul li.active');
                jQuery(".list-left ul li").each(function () {
                    if (jQuery(this).text() == rolename) {
                        jQuery(this).attr("class", "list-group-item active");
                        return false;
                    }
                });
                active = '';
                $('#selectedRoleName').empty();
                actives = $('.list-left ul li.active');
                actives.clone().appendTo('.list-right ul');
                //actives.remove();

            }
           
        }
    })

    $(document).off('click', '#saveUserRoleName').on('click', '#saveUserRoleName', function () {
       

        $.ajax({
            type: 'post',
            data: {
                userName: $(this).attr('data-userName'),
                
                roleName: $('#selectedRoleName li').html()

            },
            url: '/Security/AjaxSaveUserRoleName',
            success: function (data) {
                $("ul").empty();
                $('#mdSelectRole').modal('hide');
                bootbox.alert(data.data);
                GetUserNames();
            }
        })

    });
   
  
    
});


function ShowAssignAccessTab() {
    $.ajax({
        url: '/Security/DisplayAssignAccessTable',
        type: "GET",
        //data: { tab: tab },
        datatype: "text/plain",
        cache: false,
        async: false,
        success: function (data) {
            $('#assignAccess').html(data.PartialView);
            var dropDownHtml = '<option value="-1" selected="selected">Select Role</option>';
            $.each(data.RoleList, function (index, value) {
                dropDownHtml += '<option value="'+value.Id+'">'+value.RoleName+'</option>';
            });
            $("#dd_role").html(dropDownHtml);
        }
    });
}

$(document).on("change", "#dd_role", function () {
    var roleId = $(this).val();

    $("input[name=read]").prop('checked', false);
    $("input[name=write]").prop('checked', false);
    $("input[name=extract]").prop('checked', false);
    $("input[name=execute]").prop('checked', false);

    $("#selecctall_Read,#selecctall_Write,#selecctall_Extract,#selecctall_Execute").prop('checked', false);

    if (roleId != "-1") {
        $.ajax({
            url: '/Security/GetRoleWisePageRights',
            type: "GET",
            data: { roleId: roleId },
            datatype: "text/plain",
            cache: false,
            async: false,
            success: function (data) {
                if (data.RoleWisePageRightsList.length > 0) {
                    $.each(data.RoleWisePageRightsList, function (index, value) {
                        if (value.Read) {
                            $("#tr_" + value.PageId + "_readChk").prop('checked', true);
                        }
                        if (value.Write) {
                            $("#tr_" + value.PageId + "_writeChk").prop('checked', true);
                        }
                        if (value.Extract) {
                            $("#tr_" + value.PageId + "_extractChk").prop('checked', true);
                        }
                        if (value.Execute) {
                            $("#tr_" + value.PageId + "_executeChk").prop('checked', true);
                        }
                    });

                    if ($("input[name=read]:checked").length == $("input[name=read]").length) {
                        $("#selecctall_Read").prop("checked",true)
                    }
                    if ($("input[name=write]:checked").length == $("input[name=write]").length) {
                        $("#selecctall_Write").prop("checked", true)
                    }
                    if ($("input[name=extract]:checked").length == $("input[name=extract]").length) {
                        $("#selecctall_Extract").prop("checked", true)
                    }
                    if ($("input[name=execute]:checked").length == $("input[name=execute]").length) {
                        $("#selecctall_Execute").prop("checked", true)
                    }
                }
                else {

                }

            }
        });
    }
    else {
        
    }
});

$(document).on("click", "#btnUpdate", function (e) {
    e.preventDefault();
    var selectedRole = $("#dd_role").val();
    if (selectedRole == "-1") {
        bootbox.alert("Please select a role first");
        return false;
    }
    else {
        var pageList = [];
        $('#access tbody tr').each(function () {
            var pageId = $(this).data("pageid");

            var readRight = false;
            $("input[name=read]:checked").each(function () {
                if ($(this).attr("id") == "tr_" + pageId + "_readChk") {
                    readRight = true;
                }
            });
            var writeRight = false;
            $("input[name=write]:checked").each(function () {
                if ($(this).attr("id") == "tr_" + pageId + "_writeChk") {
                    writeRight = true;
                }
            });
            var extractRight = false;
            $("input[name=extract]:checked").each(function () {
                if ($(this).attr("id") == "tr_" + pageId + "_extractChk") {
                    extractRight = true;
                }
            });
            var executeRight = false;
            $("input[name=execute]:checked").each(function () {
                if ($(this).attr("id") == "tr_" + pageId + "_executeChk") {
                    executeRight = true;
                }
            });

            var page = {
                RoleId: selectedRole,
                PageId: pageId,
                Read: readRight,
                Write: writeRight,
                Extract: extractRight,
                Execute: executeRight
            }

            pageList.push(page);
        });

        $.ajax({
            url: '/Security/UpdateAccessRights',
            type: "POST",
            data: pageList,
            contentType: "application/json",
            data: JSON.stringify({ pageRightList: pageList }),
            //datatype: "text/plain",
            //cache: false,
            //async: false,
            success: function (data) {
                bootbox.alert("Page Rights updated successfully");
            }
        });

    }
});

$(document).on("change", "#selecctall_Read,#selecctall_Write,#selecctall_Extract,#selecctall_Execute", function () {
    var name=$(this).data("name");
    $("input[name=" + name + "]").prop('checked', $(this).prop("checked"));
});

$(document).on("change", "input[name=read]", function () {
    if ($("input[name=read]:checked").length == $("input[name=read]").length) {
        $("#selecctall_Read").prop("checked", true);
    }
    else {
        $("#selecctall_Read").prop("checked", false);
    }
});

$(document).on("change", "input[name=write]", function () {
    if ($("input[name=write]:checked").length == $("input[name=write]").length) {
        $("#selecctall_Write").prop("checked", true);
    }
    else {
        $("#selecctall_Write").prop("checked", false);
    }
});

$(document).on("change", "input[name=extract]", function () {
    if ($("input[name=extract]:checked").length == $("input[name=extract]").length) {
        $("#selecctall_Extract").prop("checked", true);
    }
    else {
        $("#selecctall_Extract").prop("checked", false);
    }
});

$(document).on("change", "input[name=execute]", function () {
    if ($("input[name=execute]:checked").length == $("input[name=execute]").length) {
        $("#selecctall_Execute").prop("checked", true);
    }
    else {
        $("#selecctall_Execute").prop("checked", false);
    }
});
