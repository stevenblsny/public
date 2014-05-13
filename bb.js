var EMA = EMA || {};
EMA.BB = (function () {
    "use strict";
    var u = {}, //User namespace
        au = {}, //Anonymous User namespace
        nitro, //User nitro obj
        nitroAnon, //Anonymous User nitro obj
        userGroup = '',
        intendJoinTeam = '',
        ucid = '',
        userPoints = 0,
        userPointsFinishedUpdate = false,
        userLevelData = {},
        voteGroupsMembers = [],
        allGroupList = [],
        rankedNitroGroupLeaderData = [],
        Widgets4ContextUser = 'undefined',
        Bottom2ActiveGroupsData = [],
        final5teamsFlag = false,
        profileUserGroupsData = {};
    profileUserGroupsData.groupPreferences = {};



    function _traceLog(data) {
        if (typeof console !== 'undefined') {
            _traceLog = function (data) {
                console.log(data);
            };
            _traceLog(data);
        }
    }

    function _processAjaxUrls(url, _then) {
        var deferred = [], defereCounter = 0, processedOk = [], processedWithError = [], i,
            _onSuccess =  function (res) {
                _traceLog("ajax success");
                if (typeof res === 'string') {
                    res = $.parseJSON(res);
                }
                _traceLog(res);
                processedOk.push(res);
                if ((--defereCounter) < 1) {
                    _then(processedOk, processedWithError);
                }
            }, _onError = function (res) {
            _traceLog("ajax error ");
            processedWithError.push(arguments);
            _traceLog(res);

            if ((--defereCounter) < 1) {
                _then(processedOk, processedWithError);
            }
        };

        for (i in url) {
            _traceLog(url[i]);

            var ajax = $.ajax({
                url: url[i],
                success: _onSuccess,
                error: _onError
            });

            deferred.push(ajax);
            defereCounter++;
        }
    }

    function _sortFluxUserFeedByBB(feed, leader) {
        var result = [], fluxById = {}, i, j, id;

        for (i in feed) {
            fluxById[feed[i].Ucid] = feed[i];
        }

        for (j in leader) {
            id = leader[j].userId;
            if (typeof fluxById[id] !== 'undefined') {
                result.push(fluxById[id]);
            }
        }
        return result;
    }

    /* function to verify the user id */
    function _verifyBBUserID(userID) {
        //var emailCheck = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (typeof userID !== 'undefined') {

            if (/^[a-zA-Z0-9- ]*$/.test(userID) === false) {
                //_traceLog('Your search string contains illegal characters.');
                return false;
            } else {
                if (userID.length === 28) {
                    return true;
                } else {
                    return false;
                }
            }

        } else {
            return false;
        }
    }

	var fluxFeedLoc = "http://daapi.flux.com";
    if ((MTVN.siteParams.stage === "local") || (MTVN.siteParams.stage === "qa")) {
    	fluxFeedLoc = "http://daapi.flux-staging.com";
    }

    function _getFluxProfileUrl(leader) {
        var ucid = MTVN.conf.sm4["ucid"];
        return fluxFeedLoc + '/2.0/00001/json/' + ucid + '/feeds/people/0' + leader.userId;
        urls.push(url);
    }

    function _shareRefererAction(api, user) {
        if(!api)
            return;
        _traceLog('_shareRefererAction: '+ user);
        api.callAPI(
                'method=user.logAction&tags=2013_Refer,desktop,'+MTVN.siteParams.bbLocale+'&value=1&userId='
                    + user + '&locale=' + MTVN.siteParams.bbLocale,
                'EMA.BB.u.triggerActionCallback'
		);
    }

    function _detectIfFacebookRel(api) {
        var q = $.parseQuery(window.location.search);
        if(typeof q.fb_ref !== 'undefined') {
            _shareRefererAction(api, q.fb_ref);
        }
    }

	var login2BB = function () {
		
		try {
			
			if(typeof EMA.BB.Widgets4ContextUser !== 'undefined'){
				if(EMA.BB.Widgets4ContextUser && EMA.BB.ucid.length > 0){				
					jQuery.ajax({
						type: 'GET',					
						url: '/bunchball/signature/'+EMA.BB.ucid+'/', //'http://'+document.location.hostname+'/bunchball/signature/'+Widgets4Context.user.ucid+'/',					
						success: function(data){
							eval(data);
							if(connectionParams){
								var nitro = new Nitro(connectionParams);
								callActions(nitro);	
							}
						},
						error: function(err) {
							_traceLog(err.toString());
							if (err.status === 200) {
								ParseResult(err);
							}
							else { _traceLog('01 : Error:' + err.responseText + '  Status: ' + err.status); }
						}
					});
				}
			}
			
			/* 	Always create the nitro Anon */
			jQuery.ajax({
				type: 'GET',				
				url: '/bunchball/signature/anonymous_me', //'http://'+document.location.hostname+'/bunchball/signature/anonymous_me/',			
				success: function(data) { 
					eval(data);
					if (connectionParams) {
						var nitroAnon = new Nitro(connectionParams);						
						callActionsAnon(nitroAnon);							
					}
				},
			    error: function(err) {
                    _traceLog(err.toString());
				    if (err.status === 200) {
					    ParseResult(err);
				    }
				    else { _traceLog('02: Error:' + err.responseText + '  Status: ' + err.status); }
			    }
			});

		}catch(e){
			_traceLog('Error when trying to login to BB: '+e);
		}
	};

	var callActionsAnon = function(nitroAnon) {
		EMA.BB.nitroAnon = nitroAnon;
		
		if (typeof EMA.BB.nitroAnon === 'object') {

            _detectIfFacebookRel(nitroAnon);


			/* We need to run au.getAllGroups() to gather required BB data for every page. 
			 * There are other page filters when it runs into au.ListGroups etc.
			 * - SH */			
			au.getAllGroups();
			/* User Profile Gameplay overlay need to be update on every page,
			 * not only the BB page
			 * - SH*/
			EMA.BB.showUserProfile();
			/* initiate display on specific page - SH */
			$(document).ready(function () {
				if ($("body")[0].id === "biggestfans-hub") {
					setTimeout(function() {
						au.Top5Fans();
						au.Bottom2Teams();						
					}, 500);
				} else if ($("body")[0].id === "gamification-detail") {					
					/* BBMODULE => TEAM PROFILE ON DETAIL */
					setTimeout(function() {
						/* group name comes from a hidden field in detail page
						 * subject to find a better way to pass group name in here - SH */
						au.Top5TeamFans($('#groupName')[0].value);
						/* display rank/fans on detail page - SH */
						(function () {
							/* Check if rankedNitroGroupLeaderData is constructed completely before continue - SH */
							if (rankedNitroGroupLeaderDataReady() !== true) {
									setTimeout(arguments.callee, 300);
									return;
							} else {
								rngld=EMA.BB.rankedNitroGroupLeaderData;
								rank='';
								jQuery.each(rngld, function (i, v) {
									if (v.groupName === $('#groupName')[0].value) { rank=i+1; }
							    });
								$('#artistDetail .position').html(rank);
								fans=EMA.BB.voteGroupsMembers[$('#groupName')[0].value];
								$('#artistDetail .count strong').html(fans);
						    	/* SH: if there are more than 5 teams left active, both 
						    	 * fans number and rank should show in fan team detail page */
						    	if (EMA.BB.final5teamsFlag !== true) {  /* phase I */
						    		$('#artistDetail .position').css('display','block');
									$('#artistDetail .count').css('display','block');
						    	} else {
						    		/* SH: if there are only 5 teams left active, check BB.isFrozen, 
						    		 * if it's true then team data is coming from ISIS, 
						    		 * so we hide both rank and fans number. 
						    		 * SH: 9/12/2013: if user's group has been eliminated 
						    		 * don't show the team rank neither */
									var txt = encodeURI($('#groupName')[0].value);
									if (txt === "Beyonc%C3%A9") {
										var nGroupName = 'Beyonce';
									} else {
										var nGroupName = $('#groupName')[0].value;
									}
						    		var bbTeam = EMA.BB.profileUserGroupsData.groupPreferences[nGroupName];
						    		if (BB.isFrozen !== true) {  /* phase II */
						    			if (bbTeam[0].value === 'true') {
							    			$('#artistDetail .position').css('display','block');
							    			$('#artistDetail .count').css('display','none');
										} else {
							    			$('#artistDetail .position').css('display','none');
							    			$('#artistDetail .count').css('display','none');
										}						    			
						    		} else {  /* phase III */
						    			$('#artistDetail .position').css('display','none');
						    			$('#artistDetail .count').css('display','none');
						    		}					    		
						    		
								}
							}
						})();
						/* update JoinTeam/MyTeam button on detail page - SH */
						(function() {							
							/* Check if profileUserGroupsData is constructed completely before continue - SH */
							if (profileUserGroupsDataReady() !== true) {
									setTimeout(arguments.callee, 300);
									return;
							} else {					
								
								var txt = encodeURI($('#groupName')[0].value);
								if (txt === "Beyonc%C3%A9") {
									var nGroupName = 'Beyonce';
								} else {
									var nGroupName = $('#groupName')[0].value;
								}		
								team = EMA.BB.profileUserGroupsData.groupPreferences[nGroupName];
								if (team[0].value === "false") { // Eliminated Team
									/* SH: 8/28/2013 default setting of button in site.css has changed to hidden */
									$('#artistDetail .artistData .bbButton').css('display','none');
								} else { // Still an active Team
									$('#artistDetail .artistData .bbButton').css('display','block');
									if ($('#groupName')[0].value === EMA.BB.userGroup) {
										$('#artistDetail .artistData .bbButton').removeClass('joinTeam').addClass('myTeam');
										$('#artistDetail .artistData .bbButton span').html(MTVN.BB.translate('BB.MyTeam'));
									} else {
										$('#artistDetail .artistData .bbButton').removeClass('myTeam').addClass('joinTeam');
										$('#artistDetail .artistData .bbButton span').html(MTVN.BB.translate('BB.JoinTeam'));
									}									
								}

							}
						})();
						
					},500);
				}
			});
			
		}
	};

	var callActions = function(nitro) {
        EMA.BB.nitro = nitro; //save it for calling it in another flux scopes
		setTimeout(function(){EMA.BB.nitro.showPendingNotifications(null,null,null, MTVN.siteParams.bbLocale);},1000);

        $(document).trigger("BB.UserLoged", {nitro: nitro});

		try {
			nitro.callAPI('method=user.getGroups&userId='+EMA.BB.ucid, 'EMA.BB.u.saveGroup');	
		} catch(e) {
			_traceLog('Error Calling action: '+e);
		}
		/* SH: GetUserPointsBalance to display user points in user profile overlay */
		//EMA.BB.GetUserPointsBalance(EMA.BB.ucid);
		u.getPointsBalance();
		/* SH: u.getUserLevelData to retrieve user level data and store in EMA.BB.userLevelData */
		u.getUserLevelData();
	};
	
	var getFluxUserData = function() {
		Flux4.getContext(function(Widgets4Context){
			if (Widgets4Context && Widgets4Context.user) {
				EMA.BB.Widgets4ContextUser = Widgets4Context.user;
				EMA.BB.ucid = Widgets4Context.user.ucid;
				//_userName = Widgets4Context.user.name;
				//_lastName = Widgets4Context.user.email;
			}else{
				EMA.BB.Widgets4ContextUser = 'undefined';
				EMA.BB.ucid = '';
			}
			login2BB();
		});
	};
	
	/* get user level info and store into EMA.BB.userLevelData - SH */
	u.getUserLevelData = function() {
		EMA.BB.userLevelData = {};
		(function() {
			if (typeof EMA.BB.nitro !== 'object') {
				setTimeout(arguments.callee, 300);
				return;
			} else {

				EMA.BB.nitro.callAPI($.param({
                        method: 'user.getLevel',
                        userIds: EMA.BB.ucid,
                        locale: MTVN.siteParams.bbLocale
                    }), 'EMA.BB.u.getUserLevelDataCallback');
			}
		})();
	};
	u.getUserLevelDataCallback = function (data) {
	    if (data.Nitro.res === 'err') {
	        var errorCode = data.Nitro.Error.Code;
	        var errorMessage = data.Nitro.Error.Message;
	        //_traceLog(errorMessage);
	    } else {
			
	    	mySiteLevelObj = data.Nitro.users.User.SiteLevel;
			myLevelName = mySiteLevelObj.name;			
			myLevelDesc = mySiteLevelObj.description;
			myBadgeImage = mySiteLevelObj.iconUrl;
	    	
            EMA.BB.userLevelData = {};
            EMA.BB.userLevelData.level = myLevelName;
            EMA.BB.userLevelData.description = myLevelDesc;
            EMA.BB.userLevelData.badge = myBadgeImage;
	    }
	};
	
	u.saveGroup = function (data) {
		try {
			if (typeof data.Nitro.userGroups !== 'boolean' && typeof data.Nitro.userGroups.Group.name !== 'undefined') {
				EMA.BB.userGroup = data.Nitro.userGroups.Group.name;
			}

		} catch(e) {
			_traceLog('Error Calling action Save Group: '+e);
		}
	};	
	
	u.getPointsBalance = function () {
		userPointsFinishedUpdate = false;
	    EMA.BB.nitro.callAPI('method=user.getPointsBalance&start=0&criteria=BALANCE&pointCategory=all&userId=' + EMA.BB.ucid, 'EMA.BB.u.getPointsBalanceCallback');
	};
	u.getPointsBalanceCallback = function (data) {
	    if (data.Nitro.res === 'err') {
	        // handle errors here
	        var errorCode = data.Nitro.Error.Code;
	        var errorMessage = data.Nitro.Error.Message;
	        //_traceLog(errorMessage);
	        userPointsFinishedUpdate=true; /* in case there is error from BB, so it doesn't cause infinity loop */
	    } else {
	        uBalance = data.Nitro.Balance.points;
	        EMA.BB.userPoints = uBalance;
	        userPointsFinishedUpdate=true;
	    }
	};	
	
	u.JoinTeam = function (data) {
		if (data.Nitro.res === 'ok') {
			myJoinedTeam = data.Nitro.userGroups.Group.name;
			EMA.BB.userGroup = myJoinedTeam;
			/* SH : remember to update user point and store it */
			u.getPointsBalance();
			/* We need to run au.getAllGroups() to gather required BB data for every page. 
			 * There are other page filters when it runs into au.ListGroups etc.
			 * - SH */
			au.getAllGroups();
			/* User Profile Gameplay overlay need to be update on every page,
			 * not only the BB page
			 * - SH */
			(function () {
				/* Check if userPointsFinishedUpdate has become true before continue - SH */
				if (userPointsFinishedUpdate !== true) {
						setTimeout(arguments.callee, 300);
						return;
				} else {
					EMA.BB.showUserProfile();
				}
			})();			
			/* refresh different modules on specific page - SH */
			$(document).ready(function () {
				if ($("body")[0].id === "biggestfans-hub") {
					setTimeout(function() {
						au.Top5Fans();
						au.Bottom2Teams();
					},500);
				} else if ($("body")[0].id === "gamification-detail") {
					setTimeout(function() {
						/* group name comes from a hidden field in detail page
						 * subject to find a better way to pass group name in here - SH */
						au.Top5TeamFans($('#groupName')[0].value);
						/* display rank/fans on detail page */
						(function(){
							/* Check if profileUserGroupsData is constructed completely before continue - SH */
							if (rankedNitroGroupLeaderDataReady() !== true) {
									setTimeout(arguments.callee, 300);
									return;
							} else {
								rngld=EMA.BB.rankedNitroGroupLeaderData;
								rank='';
								jQuery.each(rngld, function (i, v) {
									if (v.groupName === $('#groupName')[0].value) { rank=i+1; }
							    });
								$('#artistDetail .position').html(rank);
								fans=EMA.BB.voteGroupsMembers[$('#groupName')[0].value];
								$('#artistDetail .count strong').html(fans);
							}
						})();
						/* update JoinTeam/MyTeam button on detail page - SH */
						if ($('#groupName')[0].value === EMA.BB.userGroup) {
							$('#artistDetail .artistData .bbButton').removeClass('joinTeam').addClass('myTeam');
							$('#artistDetail .artistData .bbButton span').html(MTVN.BB.translate('BB.MyTeam'));
						} else {
							$('#artistDetail .artistData .bbButton').removeClass('myTeam').addClass('joinTeam');
							$('#artistDetail .artistData .bbButton span').html(MTVN.BB.translate('BB.JoinTeam'));
						}						
					}, 500);			
				}
			});
		}		

		if (!EMA.BB.Widgets4ContextUser.communityMember && typeof EMA.BB.Widgets4ContextUser.ucid === 'undefined') {
			//window.scrollTo(0,0);
			//jQuery('.groupSelected').removeClass('groupSelected');
		} else {
			//jQuery('.groupSelected').removeClass('joinTeam').addClass('leaveTeam').removeClass('groupSelected').html('<span>${function.phrase("bb_leaveTeam")}</span>');
		}
	};
	
	/* MODULE TRIGGERS */	
	/* Hub/Detail page gather all 15 Teams data trigger */
	au.getAllGroups = function () {
		(function () {
			if (typeof EMA.BB.nitroAnon !== 'object') {
				setTimeout(arguments.callee, 300);
				return;
			} else {
				EMA.BB.nitroAnon.callAPI('method=site.getGroups&pageSize=40&returnCount=100', 'EMA.BB.au.countMembers');
			}
		})();		
	};
	
	/* Hub page display top 5 Fans trigger */
	au.Top5Fans = function () {
		EMA.BB.nitroAnon.callAPI("method=site.getPointsLeaders&groupName=&returnCount=&method=site.getPointsLeaders&duration=ALLTIME&userIds=&start=0&criteria=BALANCE&tagsOperator=AND&pointCategory=Points", "EMA.BB.au.getTop5Teamfans");
	};
	
	/* Detail page display top 5 Team Fans trigger */
	au.Top5TeamFans = function (gname) {
		// SH: this is throwing an error on detail fan pages - will fix before uncommenting again
		// SH: Top 5 Team Fans function is ready - 8/25/13
		EMA.BB.nitroAnon.callAPI("method=site.getPointsLeaders&groupName="+ encodeURI(gname) +"&returnCount=&method=site.getPointsLeaders&duration=ALLTIME&userIds=&start=0&criteria=BALANCE&tagsOperator=AND&pointCategory=Points", "EMA.BB.au.getTop5Teamfans");
	};
	
	/* Hub page display bottom 2 active teams trigger */
	au.Bottom2Teams = function () {
		au.getBottom2ActiveGroups();
		au.showBottom2Groups();
		//au.hilightBottom2Groups(); /* moved inside au.ListGroups - SH */
	};
	
	/* Hub/Detail page display user profile trigger */
	var showUserProfile = function () {
		if (typeof EMA.BB.Widgets4ContextUser === "object" && EMA.BB.ucid.length > 0) {			
			u.UserProfile();
		} else {
			au.anonUserProfile();			
		}
		u.UserGameplayProfile();
	};
	/* BBMODULE => GAMEPLAY TAB ON FLUX USER PROFILE OVERLAY */
	u.UserGameplayProfile = function () {
		/* display TEAM name/rank/ 
		 * and     USER points/level badge/level desc
		 * in FLUX USER PROFILE OVERLAY Gameplay Tab */		

				(function() {
					
					if (rankedNitroGroupLeaderDataReady() !== true) {
						/* Check if rankedNitroGroupLeaderData is constructed completely before continue - SH */
							setTimeout(arguments.callee, 300);
							return;
					} else if (userLevelDataReady() !== true) {
						/* Check if userLevelData is constructed completely before continue - SH */
							setTimeout(arguments.callee, 300);
							return;
					} else if (profileUserGroupsDataReady() !== true) {
						/* Check if profileUserGroupsData is constructed completely before continue - SH */
							setTimeout(arguments.callee, 300);
							return;
					} else {
						myID = EMA.BB.ucid;
						myGroup = EMA.BB.userGroup;
						rngld=EMA.BB.rankedNitroGroupLeaderData;
						myGroupRank = '';
						myGroupPoints = 0;
						myPoints = EMA.BB.userPoints;
						
						/* User belong to a team */
						if (myGroup.length > 0) {						
						
							jQuery.each(rngld, function (i, v) {
								if (v.groupName === myGroup) { 
									myGroupRank = i+1;
									myGroupPoints = v.value;
								}							
							});						
	
					        /* display TEAM image */	
							var txt = encodeURI(myGroup);
							if (txt === "Beyonc%C3%A9") {
								var nGroupName = 'Beyonce';
							} else {
								var nGroupName = myGroup;
							}			
							if (typeof EMA.BB.profileUserGroupsData.groupPreferences[nGroupName] !== 'undefined') {
								var teamImage = MTVN.BB.teamSquareImagePrefix + EMA.BB.profileUserGroupsData.groupPreferences[nGroupName][1].value + MTVN.BB.teamImage150x150Postfix;
								$(".profileOverlayTeamImage").attr('src', teamImage);
							}						
							
							/* display TEAM name/rank */												
							/* SH: if there are only 5 teams left active BB.isFrozen=true, 
				    		 * team data is coming from ISIS, we hide rank in profile overlay. 
				    		 * SH: 9/12/2013: if user's group has been eliminated 
				    		 * don't show the team rank in user profile overlay */
							var bbTeam = EMA.BB.profileUserGroupsData.groupPreferences[nGroupName];
							if (BB.isFrozen !== true) {
								if (EMA.BB.final5teamsFlag !== true) {
									$('#profileOverlay-gamePlay .artistData .position').html(myGroupRank);
							        $('#profileOverlay-gamePlay .artistData .position').css('display','block');
								} else if (bbTeam[0].value === 'true') {
									$('#profileOverlay-gamePlay .artistData .position').html(myGroupRank);
							        $('#profileOverlay-gamePlay .artistData .position').css('display','block');	
								} else {
									$('#profileOverlay-gamePlay .artistData .position').css('display','none');
									$('#profileOverlay-gamePlay .artistData .position').html('');
								}
							} else {
								$('#profileOverlay-gamePlay .artistData .position').css('display','none');
								$('#profileOverlay-gamePlay .artistData .position').html('');								
							}
					        $('#profileOverlay-gamePlay .artistData .mtvn-mdl-hdr h3').html(myGroup);
	
					        /* display USER points/level-badge/level-desc */
							$("#userProfile-bbLevel .count .profileOverlayPoints").html(myPoints);
							badgeImg = '<img src="'+ EMA.BB.userLevelData.badge +'?height=150&amp;width=150&amp;matte=true&amp;quality=0.85" alt="'+ EMA.BB.userLevelData.level +'">';
							desc = EMA.BB.userLevelData.description;		        
					        $('#userProfile-bbLevel .profileOverlay-Level-avatar').html(badgeImg);
					        $('#userProfile-bbLevel .profileOverlay-Level-description').html(desc);					        
					        
					        $('#profileOverlay-gamePlayWrapper').css('display','block');
							$('#profileOverlay-noTeam').css('display','none');
							$('#profileOverlay-gamePlay .mtvn-mdl-hdr .profileOverlayTeam').css('display','block');

						/* User doesn't belong to a team */
						} else {
							/* data gets mangled when logging out / in: team  */
							$('#profileOverlay-gamePlayWrapper').css('display','none');
							$('#profileOverlay-noTeam').css('display','block');
							$('#profileOverlay-gamePlay .mtvn-mdl-hdr .profileOverlayTeam').css('display','none');
						}				        
			        
					}
				})();				

	};
	
	/* BBMODULE => USER PROFILE ON HUB AND TEAM DETAIL - SIGNED IN FLUX */
	u.UserProfile = function () {
				
				/* display teamName/rank/points/viewLink in user profile module */
				(function () {
					
					if (rankedNitroGroupLeaderDataReady() !== true) {
						/* Check if rankedNitroGroupLeaderData is constructed completely before continue - SH */
							setTimeout(arguments.callee, 300);
							return;
					} else if (profileUserGroupsDataReady() !== true) {
						/* Check if profileUserGroupsData is constructed completely before continue - SH */
							setTimeout(arguments.callee, 300);
							return;
					} else if (userLevelDataReady() !== true) {
						/* Check if profileUserGroupsData is constructed completely before continue - SH */
						setTimeout(arguments.callee, 300);
						return;					
					} else {
						/* Logged in user */
						myID = EMA.BB.ucid;
						myGroup = EMA.BB.userGroup;
						rngld = EMA.BB.rankedNitroGroupLeaderData;
						myGroupRank = '';
						myGroupPoints = 0;
						myPoints = EMA.BB.userPoints;
						
						/* User belong to a team */
						if (myGroup.length > 0) {
							
							jQuery.each(rngld, function (i, v) {
								if (v.groupName === myGroup) { 
									myGroupRank = i+1;
									myGroupPoints = v.value;
								}							
							});

							txt = encodeURI(myGroup);
						
							if (txt === "Beyonc%C3%A9") {
								var tgroupName = 'Beyonce';
							} else {
								var tgroupName = myGroup;
							}

							var bbTeam = EMA.BB.profileUserGroupsData.groupPreferences[tgroupName],
				        		teamImage = MTVN.BB.teamSquareImagePrefix + bbTeam[1].value + MTVN.BB.teamImage150x150Postfix,
				        		teamPage  = MTVN.BB.BiggestFanUrl + bbTeam[2].value;

							$('#fanUserProfile .fanTeam.loggedIn .mtvn-mdl-hdr h3').html(myGroup);
							/* SH: if there are only 5 teams left active BB.isFrozen=true, 
				    		 * team data is coming from ISIS, we hide rank in profile snapshot. 
				    		 * SH: 9/12/2013: if user's group has been eliminated 
				    		 * don't show the team rank in user perfile snapshot*/
							if (BB.isFrozen !== true) {
								if (EMA.BB.final5teamsFlag !== true) {
									$('#fanUserProfile .fanTeam.loggedIn .fanTeamRank').css('display','block');
									$('#fanUserProfile .fanTeam.loggedIn .fanTeamRank .fanTeamRankBB').html(myGroupRank);
								} else if (bbTeam[0].value === 'true') {
									$('#fanUserProfile .fanTeam.loggedIn .fanTeamRank').css('display','block');
									$('#fanUserProfile .fanTeam.loggedIn .fanTeamRank .fanTeamRankBB').html(myGroupRank);	
								} else {
									$('#fanUserProfile .fanTeam.loggedIn .fanTeamRank').css('display','none');
									$('#fanUserProfile .fanTeam.loggedIn .fanTeamRank .fanTeamRankBB').html('');
								}
							} else {
								$('#fanUserProfile .fanTeam.loggedIn .fanTeamRank').css('display','none');
								$('#fanUserProfile .fanTeam.loggedIn .fanTeamRank .fanTeamRankBB').html('');
							}
							//$('#fanUserProfile .fanTeam.loggedIn .fanTeamData .fanTeamPoints strong').html(myGroupPoints);

							$("#fanUserProfile .profileOverlayPoints").html(myPoints);
							$('#fanUserProfile .fanTeam.loggedIn .fanTeamImage').html('<div class="bb-teamAvatar"><a href="' + teamPage + '"><img src="' + teamImage + '" alt="' + myGroup + '" width="79" height="79" /></a></div>');
							$('#fanUserProfile .fanTeam.loggedIn a.viewMore').live('click', function(e){

							e.preventDefault();
							e.stopPropagation();
							$(".loggedInMenu .profile a").click();
								//window.location.href=teamPage;
							});

					        /* display USER level-badge/level-desc */				
							badgeImg = '<img src="'+ EMA.BB.userLevelData.badge +'?height=66&amp;width=66&amp;matte=true&amp;quality=0.85" alt="'+ EMA.BB.userLevelData.level +'">';
							desc = EMA.BB.userLevelData.description;
							$('#fanUserProfile .fanTeam.loggedIn .fanTeamBadge').html(badgeImg);
							$('#fanUserProfile .fanTeam.loggedIn .mtvn-desc').html(desc);
			
							/* switch to signed-in version block */
							$('#fanUserProfile').addClass('loaded');
							$('#fanUserProfile .userProfileWrapper .fanTeam.loggedOut').css('display','none');
							$('#fanUserProfile .userProfileWrapper .fanTeam.loggedIn').css('display','block');
							$('#fanUserProfile .userProfileWrapper #fanProfile-noTeam').css('display','none');
						
						
						/* User doesn't belong to a team (but signed in flux) */
						/* this is a bit of a mess - shouldn't we have all 3 cases in 1 script ??? */
						} else {
							$('#fanUserProfile').addClass('loaded');
							$('#fanUserProfile .userProfileWrapper .fanTeam.loggedOut').css('display','none');
							$('#fanUserProfile .userProfileWrapper .fanTeam.loggedIn').css('display','none');
							$('#fanUserProfile .userProfileWrapper #fanProfile-noTeam').css('display','block');							
							$('#fanUserProfile .fanTeam.loggedIn .mtvn-mdl-hdr h3').html(myGroup);	
						}
					}
				})();				
				
	};
	
	
	/* BBMODULE => TEAM PROFILE ON DETAIL - NOT SIGNED IN FLUX */
	au.anonUserProfile = function () {
		(function () {
			if (typeof EMA.BB.nitroAnon !== 'object') {
				setTimeout(arguments.callee, 300);
				return;
			} else {
				$('#fanUserProfile').addClass('loaded');
				$('#fanUserProfile .userProfileWrapper .fanTeam.loggedOut').css('display','block');
				$('#fanUserProfile .userProfileWrapper .fanTeam.loggedIn').css('display','none');
				$('#fanUserProfile .userProfileWrapper #fanProfile-noTeam').css('display','none');
								
			}
		})();
	};
	
	/* LOCAL DATA OBJ READY CHECKERS */
	
	/* check if profileUserGroupsData (BB properties list) is ready - SH */
	var profileUserGroupsDataReady = function () {
		var count = 0;
		for (property in EMA.BB.profileUserGroupsData.groupPreferences) {
		   if (EMA.BB.profileUserGroupsData.groupPreferences.hasOwnProperty(property)) { count++; }
		   }
		if (count === 15) {
			return true;
		} else {
			return false;
		}
	};
	/* check if Bottom2ActiveGroupsData is ready - SH */
	var Bottom2ActiveGroupsDataReady = function () {
		var count = 0;
		for (property in EMA.BB.Bottom2ActiveGroupsData) {
		   if (EMA.BB.Bottom2ActiveGroupsData.hasOwnProperty(property)) { count++; }
		}
		if (count === 2) {
			return true;
		} else {
			return false;
		}
	};
	/* check if rankedNitroGroupLeaderData is ready - SH */
	var rankedNitroGroupLeaderDataReady = function() {
		var count = 0;
		for (property in EMA.BB.rankedNitroGroupLeaderData) {
		   if(EMA.BB.rankedNitroGroupLeaderData.hasOwnProperty(property)) { count++; }
		}
		if (count === 15) { 
			/* SH: 8/28/2013 : temporarily change count number from 15 -> 14 
			 * because of BB issue, they returns only 14 teams.
			 * should change it back to 15 before launch 
			 * SH: change it back to 15, for BB ask us to set retrieve number count to 100*/
			return true;
		} else {
			return false;
		}
	};
	/* check if rankedNitroGroupLeaderData is ready - SH */
	var userLevelDataReady = function() {
		var count = 0;
		for (property in EMA.BB.userLevelData) {
		   if(EMA.BB.userLevelData.hasOwnProperty(property)) { count++; }
		}
		if (count === 3) {
			return true;
		} else {
			return false;
		}
	};	
	au.countMembers = function (data) {
		
		/* initiate display on specific page - SH */
		$(document).ready(function () {
			//if($("body")[0].id === "biggestfans-hub") {
				setTimeout(function () {
					EMA.BB.nitroAnon.callAPI('method=site.getGroupPointsLeaders&duration=ALLTIME&criteria=BALANCE&returnCount=100', 'EMA.BB.au.ListGroups');
				}, 500);
			//} else if($("body")[0].id === "gamification-detail") {
				
			//}
		});		
		
		if (data.Nitro.res === "ok") {
			jQuery.each(data.Nitro.groups.Group, function (i,v) {
				EMA.BB.voteGroupsMembers[v.name] = v.count;
				EMA.BB.allGroupList[i] = v;
				/* Call constructGroupPref() to construct BB Group Preferences json obj - SH */
				constructGroupPref(v.name);
			});
		}



	};
	
	/* BBMODULE => TEAM GRID ON HUB */
	/* Hub page 15 Teams Generator */
	au.ListGroups = function (data) {

		(function () {
			/* Check if profileUserGroupsData is constructed completely before continue - SH */
			if (profileUserGroupsDataReady() !== true) {
					setTimeout(arguments.callee, 300);
					return;
			} else {
			    var temp = '',
			        rank = 1,
			        nitroGroupLeader = data.Nitro.groupLeaders.groupLeader,
			        tmpNitroGroupLeader = [];
			    
			    /* start rearrange list to move inactive teams to bottom - SH 
			     * tmpNitroGroupLeader is the list we will be using to generate team grid on page*/
			    var tt = [];
			    jQuery.each(nitroGroupLeader, function (i, v) {
					var txt = encodeURI(v.groupName);
					var groupName;
					if (txt === "Beyonc%C3%A9") {
						groupName = 'Beyonce';
					} else {
						groupName = v.groupName;
					}
			        var bbTeam = EMA.BB.profileUserGroupsData.groupPreferences[groupName];	    	
			    	
			        if (typeof bbTeam !== 'undefined' && bbTeam[0].value === "true") {
			        	tmpNitroGroupLeader.push(v);
			        } else {
			        	tt.push(v);
			        }
			    });
			    for (w = 0; w < tt.length; w++) {
			    	tmpNitroGroupLeader.push(tt[w]);
			    }
			    
			    /* EMA.BB.final5teamsFlag set to true when we found there are 10 inactive teams alread - SH */
			    if (tt.length === 10){ EMA.BB.final5teamsFlag = true; }
			    
			    /* store tmpNitroGroupLeader as global variable, both hub and detail pages need it - SH */
			    EMA.BB.rankedNitroGroupLeaderData = tmpNitroGroupLeader;
			    
				if ($("body")[0].id === "biggestfans-hub") {			    
			    /* Start generating groups grid, only happens in hub page - SH */
						
				    //ugly hack - open container here 
				    temp += '<ul class="mtvn-lst mtvn-lst-500x100">';
				    var groupName;
				    jQuery.each(tmpNitroGroupLeader, function (i, v) {
				        
				    	/* if there are only 5 teams left active, skip the rest of the teams, start from i=5 */
				    	if (EMA.BB.final5teamsFlag === true) {
				    		if (i>4) {return false;}
				    	}
				    	
				    	if (i > 0) { rank++; }
				    	
						var origGroupName = v.groupName,
							txt = encodeURI(v.groupName);
						if (txt === "Beyonc%C3%A9") {
							var groupName='Beyonce';
						} else {
							var groupName = v.groupName;
						}
				        var bbTeam = EMA.BB.profileUserGroupsData.groupPreferences[groupName];
				        
				        if (typeof bbTeam !== 'undefined') {				        	
					        
					        var	teamImage = MTVN.BB.teamImageMainPrefix + bbTeam[1].value + MTVN.BB.teamImageMainPostfix,
								teamPage  = MTVN.BB.BiggestFanUrl + bbTeam[2].value,
					        	cssClass = "";
		
					        if (origGroupName === EMA.BB.userGroup) {
					        	cssClass += " my-team ";
					        }
					        if (bbTeam[0].value === "false") {
					        	cssClass += " bbTeam-inactive ";
					        	teamImage = teamImage + MTVN.BB.teamImageMainPostfixEliminated;
					        }
					        
					    	temp += '<li class="' + cssClass + '">';
					        temp += '<div class="position">' + rank + '</div>';
					        temp += '<div class="data" style="background-image:url(' + teamImage + ')" >';
					        temp += '<div class="meta"><h3 class="mtvn-t mtvn-t3">' + origGroupName + '</h3>';
					        // temp += '<div class="bbTotal">' + v.value + ' <span> '+ MTVN.BB.translate('BB.teamPoints') +' </span></div>';
					    		/* if there are only 5 teams left active, don't display fans number */
						    	if (EMA.BB.final5teamsFlag === false) {
					        temp += '<p class="fan-count"><strong>' + voteGroupsMembers[origGroupName] + '</strong> ' + MTVN.BB.translate('BB.fans') + '</p>';	        
						    	}
					        temp += '<div class="fanTeambuttons clearAfter">';
						        if (origGroupName === EMA.BB.userGroup) {
						        	temp += '<span class="bbButton myTeam" title="'+ origGroupName +'">'+ MTVN.BB.translate('BB.MyTeam') +'</span>';   
						        } else {
						        		if (bbTeam[0].value!="false") {
						        				temp += '<button type="submit" class="bbButton joinTeam" title="'+ origGroupName +'"><span>'+ MTVN.BB.translate('BB.JoinTeam') +'</span></button>';
						        		}			
						        }
				     		temp += '<a href="'+ teamPage +'" class="bbButton fanTeam-link">'+ MTVN.BB.translate('BB.ViewTeam') +'</a>';
				    		temp += '</div></div><span class="cover"></span></div>';
					        temp += '</li>';
				        
				        }
	
				    });			    
	
				    //ugly hack - close container here 
				    temp += '</ul>';
			
				    jQuery('#listOfGroups').html(temp);
				    $('#listOfGroups').addClass('loaded'); /* To remove loader - JE */
				    
				    /* SH: Hilite bottom 2 teams at risk only after group list is finished rendering on page */
    	        	/* if there are only 5 teams left active, skip the following code */
    	        	if (EMA.BB.final5teamsFlag !== true && BB.isFrozen !== true) {
    	        		/* phase II & phase III */
			    		au.hilightBottom2Groups();
			    	}				    
				    /* SH: if there are only 5 teams left active and isFrozen,  
				     * modify classes and button for all teams */
    	        	if (BB.isFrozen === true) {
    	        		/* phase III */
    	        		$('#fanTeamList-ISIS ul li .data .meta h3').each(function (i, v) {
				        	$(this).closest("div").children('.fanTeambuttons').find($('button')).remove();
				        	$(this).closest("div").children('.fanTeambuttons').find($('span')).remove();
    				        if ($(this).text() === EMA.BB.userGroup) {
    				        	$(this).closest("li").addClass(" my-team ");
    				        	temp = '<span class="bbButton myTeam" title="'+ $(this).text() +'">'+ MTVN.BB.translate('BB.MyTeam') +'</span>';
    				        	$(this).closest("div").children('.fanTeambuttons').children('a.fanTeam-link').before(temp);
    				        } else {
    				        	$(this).closest("li").removeClass(" my-team ");
    				        	temp = '<button type="submit" class="bbButton joinTeam" title="'+ $(this).text() +'"><span>'+ MTVN.BB.translate('BB.JoinTeam') +'</span></button>';
    				        	$(this).closest("div").children('.fanTeambuttons').children('a.fanTeam-link').before(temp);
    				        }
    				    });
			    	}				    
				    
				
				} else if ($("body")[0].id === "gamification-detail") {
				/* don't generate groups grid, it only happens in hub page - SH */
										
				}			    
			}
		})();
	};

	/* BBMODULE => TOP 5 TEAM FANS ON DETAIL */
	au.getTop5Teamfans = function (data) {
	    if (data.Nitro.res === 'err') {
	        var errorCode = data.Nitro.Error.Code;
	        var errorMessage = data.Nitro.Error.Message;
	        _traceLog("03: " + errorMessage);
            return ;
        }

        /* SH :
         * typeof data.Nitro.leaders === 'boolean'
         * - group has 0 user
         *
         * typeof data.Nitro.leaders === 'object' && typeof data.Nitro.leaders.Leader.length === "undefined"
         * - group has only 1 user
         *
         * typeof data.Nitro.leaders === 'object' && typeof data.Nitro.leaders.Leader.length === "number"
         * - group has more than 1 users
         */

        /* au.getTop5fans should have done the same, but there is always more than 1 user in that case - SH */

        _traceLog("begin getTop5Teamfans callback ");
        _traceLog(data);

        var leaders = [];

        if (typeof data.Nitro.leaders === 'boolean') {
            /* no fans at all. do nothing, except remove the spinner */
            $('#top5container').addClass('loaded');
        } else if (typeof data.Nitro.leaders === 'object' && typeof data.Nitro.leaders.Leader.length === "undefined") {
            /* display only 1 user */
            leaders.push(data.Nitro.leaders.Leader);
        } else if (typeof data.Nitro.leaders === 'object' && typeof data.Nitro.leaders.Leader.length === "number") {
            leaders = data.Nitro.leaders.Leader;
        }

        // filter the leader by _verifyBBUserID and slice just 5
        leaders = $.grep(leaders, function(v) { return _verifyBBUserID(v.userId)}).slice(0, 5);

        if(leaders.length) {
            $('#top5container').html('');

            _processAjaxUrls($.map(leaders, _getFluxProfileUrl), function (ok, errors) {
                var s = '';

                var fluxUserFeed = _sortFluxUserFeedByBB(ok, leaders);
                for (var i in fluxUserFeed) {
                    var json = fluxUserFeed[i];

                    s += '<li'
                    if (i === 0) {s += ' class="firstItemOfRow"'};
                    s += '><div class="bbAvatar"><div class="bbAvatarContainer"><img src="' +
                        json.Thumbnails.VeryLarge + '" alt="' + json.ucid + '" /></div></div>'+
                        '<div class="bbName">' + json.Title.substring(0,6) + '</div>'+
                        '<div class="bbPoints">' + json.points + ' ' + MTVN.BB.translate('BB.teamPoints') + '</div></li>';
                }
                $('#top5container').append(s);
                $('#top5container').addClass('loaded');
            });
        }
	};

	/* SH - New action function */
	u.FireBBAction = function(action){
        _traceLog("FIRE ACTION: " + action);
		$(document).ready(function () {		
			var actionCheck = setInterval(function () {


				if (typeof EMA.BB.nitro !== 'undefined') { 
					/* ONLY WHEN USER HAS LOGED IN CAN FIRE AN ACTION */
				
						
						/* CHECK if the User team is an Eliminated Team. If yes stop firing. - SH*/
						(function(){
							/* Check if profileUserGroupsData is constructed completely before continue - SH */
							if (profileUserGroupsDataReady() !== true) {
									setTimeout(arguments.callee, 300);
									return;
							} else {
								
								if (EMA.BB.userGroup.length > 0) {
									var txt = encodeURI(EMA.BB.userGroup);
									if (txt === "Beyonc%C3%A9") {
										var nGroupName = 'Beyonce';
									} else {
										var nGroupName = EMA.BB.userGroup;
									}		
									team = EMA.BB.profileUserGroupsData.groupPreferences[nGroupName];
									if (team[0].value === "false") { // In an Eliminated Team
										/* do nothing */
										
									} else { // In an Active Team	
										
										/*************** SH: Action code start *******************/
										var actionBB = "";
										if (typeof action !== 'undefined'){ actionBB = action; }
										if (actionBB!='') {			
											try {
												(function () {
													if (typeof EMA.BB.nitro !== 'object') {
														setTimeout(arguments.callee, 300);
														return;
													} else {							
														setTimeout(function() {
															if (EMA.BB.userGroup.length>0) {
																//EMA.BB.nitro.callAPI('method=user.logAction&tags='+ escape(actionBB) +'&value=1&userId='+ EMA.BB.ucid  + '&locale=' + MTVN.siteParams.bbLocale, 'EMA.BB.u.triggerActionCallback');
																EMA.BB.nitro.callAPI('method=user.logAction&tags='+ escape(actionBB) +',desktop,'+ MTVN.siteParams.bbLocale +'&value=1&userId='+ EMA.BB.ucid  + '&locale=' + MTVN.siteParams.bbLocale, 'EMA.BB.u.triggerActionCallback');
																//EMA.BB.nitro.callAPI('method=user.logAction&tags='+ escape(actionBB) +',desktop,'+ MTVN.siteParams.bbLocale +'&value=1&userId='+ EMA.BB.ucid  + '&locale=' + MTVN.siteParams.bbLocale, 'EMA.BB.u.triggerActionCallback');
															}
														}, 500);
											           	setTimeout(function(){EMA.BB.nitro.showPendingNotifications(null,null,null,"MTVN.siteParams.bbLocale");},3000);
													}
												})();
											}catch(e){_traceLog('ERROR: Call to action:'+e)}
										}
										/*************************************/							
										
									}
								}

							}
						})();
					
				} else {							
					/* DO NOTHING SINCE USER HAS NOT LOGED IN */
				}
					
					
				clearInterval(actionCheck);

			}, 3000);
		});		
	};	

	u.triggerActionCallback = function (data) {
		//_traceLog("triggerActionCallback called", data);
	    if (data.Nitro.res === 'err') {
	        // handle errors here
	        var errorCode = data.Nitro.Error.Code;
	        var errorMessage = data.Nitro.Error.Message;
	        _traceLog("06: " + errorMessage);
	    } else {
			/* SH : remember to update user point and store it */
			u.getPointsBalance();
	    	/* SH: Refresh BB Components of a page, mainly for non BB pages */
			/* We need to run au.getAllGroups() to gather required BB data for every page. 
			 * There are other page filters when it runs into au.ListGroups etc.
			 * - SH */			
			au.getAllGroups();
			/* User Profile Gameplay overlay need to be update on every page,
			 * not only the BB page
			 * - SH*/
			(function(){
				/* Check if userPointsFinishedUpdate has become true before continue - SH */
				if (userPointsFinishedUpdate !== true) {
						setTimeout(arguments.callee, 500);
						return;			
				} else {
					EMA.BB.showUserProfile();
	    		}
			})();
	    }
	};
	
	var constructGroupPref = function (gname){
		var txt = encodeURI(gname);
		if (txt === "Beyonc%C3%A9") {
			txt = new String('Beyonce');
		} else {
			txt = gname;
		}
		EMA.BB.nitroAnon.callAPI('method=group.getPreferences&groupName='+encodeURI(gname), 'EMA.BB.au.constructGroupPrefCallback', txt);
	};
	
	au.constructGroupPrefCallback = function (data, token) {
	    if (data.Nitro.res === 'err') {
	        var errorCode = data.Nitro.Error.Code;
	        var errorMessage = data.Nitro.Error.Message;
	        _traceLog("05: " + errorMessage);
	    } else {
	    	var myObject = [];
	    	jQuery.each(data.Nitro.groupPreferences.GroupPreference, function (i, v) {
	    		myObject.push(data.Nitro.groupPreferences.GroupPreference[i]);
	    	});
	    	EMA.BB.profileUserGroupsData.groupPreferences[token] = myObject;
	    }
	};

	/* BOTTOM 2 TEAMS RELATED */
	
	/* get bottom two teams info and store into EMA.BB.Bottom2ActiveGroupsData - SH */
	au.getBottom2ActiveGroups = function () {		
		(function(){
			if (typeof EMA.BB.nitroAnon !== 'object') {
				setTimeout(arguments.callee, 300);
				return;
			} else {
				EMA.BB.nitroAnon.callAPI('method=site.getGroupPointsLeaders&duration=ALLTIME&criteria=BALANCE&returnCount=100', "EMA.BB.au.getBottom2ActiveGroupsCallback");
			}
		})();		
	};	
	au.getBottom2ActiveGroupsCallback = function (data) {
  
		(function () {
			/* Check if profileUserGroupsData is constructed completely before continue - SH */
			if (profileUserGroupsDataReady() !== true) {
					setTimeout(arguments.callee, 300);
					return;
			} else {
		
				var tempallGroupList = [],
		        	nitroGroupLeader = data.Nitro.groupLeaders.groupLeader,
		        	preference = profileUserGroupsData.groupPreferences;
		        
			    jQuery.each(nitroGroupLeader, function (i, v) {
					var txt = encodeURI(v.groupName);
					if (txt === "Beyonc%C3%A9") {
						var groupName='Beyonce';
					} else {
						var groupName=v.groupName;
					}
			    	if (typeof preference[groupName] !== 'undefined' && preference[groupName][0].value === 'true') {
			    		tempallGroupList.push(v);
			    	}	        
			    });
			    var rank = tempallGroupList.length;
			    
			    sortJsonArrayByProperty(tempallGroupList, 'value', 1);
			    
			    EMA.BB.Bottom2ActiveGroupsData = [];
			    jQuery.each(tempallGroupList, function (i, v) {
			
			        if (i < 2) {
			            if (i > 0) {
			                rank--;
			            };
			            var myObj = {};
			            myObj.rank = rank;
			            myObj.team = v;
			            
			            EMA.BB.Bottom2ActiveGroupsData.push(myObj);
			        }	
			    });
			}
		})();
		
	};
	/* BBMODULE => BOTTOM 2 RISK TEAMS BLOCK ON HUB */
	au.showBottom2Groups = function () {

		(function () {
			/* Check if Bottom2ActiveGroupsData is constructed completely before continue - SH */
			if (Bottom2ActiveGroupsDataReady() !== true) {
					setTimeout(arguments.callee, 300);
					return;
			/* Check if profileUserGroupsData is constructed completely before continue - SH */
			} else if (profileUserGroupsDataReady() !== true) {			
					setTimeout(arguments.callee, 300);
					return;					
			} else {						
					
				var b2ag = EMA.BB.Bottom2ActiveGroupsData;
				
			    var temp = '';
			    temp += '<div id="bb-TeamsAtRisk">';
			    jQuery.each(b2ag, function (i, v) {
			    	rank = v.rank;
			    	groupName = v.team.groupName;
			    	points = v.team.value;
			    	fans = EMA.BB.voteGroupsMembers[groupName];
					
					txt = encodeURI(groupName);
					if (txt === "Beyonc%C3%A9") {
						var tgroupName='Beyonce';
					} else {
						var tgroupName=groupName;
					}

			        var bbTeam = EMA.BB.profileUserGroupsData.groupPreferences[tgroupName],
			        	teamImage = MTVN.BB.teamSquareImagePrefix + bbTeam[1].value + MTVN.BB.teamImage150x150Postfix;
						teamPage  = MTVN.BB.BiggestFanUrl + bbTeam[2].value;
        
			        	temp += '<div class="bb-teamAvatar"><a href="' + teamPage + '"><img src="' + teamImage + '" alt="' + groupName + '" width="79" height="79" /></a></div>';
		
			    });
	            temp += '</div>';
		
			    jQuery('#listOfBottomTeams').html(temp);
			    jQuery('#listOfBottomTeams').addClass('loaded');
	    
			}
		})();
	};
	/* BBMODULE => BOTTOM 2 RISK TEAMS HILIGHT IN TEAM GRID */
	au.hilightBottom2Groups = function () {
		
		(function(){
			/* Check if Bottom2ActiveGroupsData is constructed completely before continue - SH */
			if (Bottom2ActiveGroupsDataReady() !== true) {
					setTimeout(arguments.callee, 300);
					return;
			} else {					
				var b2ag = EMA.BB.Bottom2ActiveGroupsData;
				jQuery.each(b2ag, function (i, v) {
					rank = v.rank-1;
					$("#listOfGroups ul li:eq("+rank+")").addClass("riskElimination");
			    });	    
			}
		})();		
	};

	/* Join buttons of Hub/Detail pages */
	jQuery('.joinTeam').live('click', function (e) {
		e.preventDefault();
		e.stopPropagation();
		if (typeof EMA.BB.Widgets4ContextUser === "object") {
			//window.scrollTo(0,0);
			if (typeof EMA.BB.nitro !== "undefined") {
				EMA.BB.nitro.callAPI('method=user.joinGroup&userId='+EMA.BB.ucid+'&groupName='+encodeURI(jQuery(this).attr('title')),'EMA.BB.u.JoinTeam');
			}
		} else {
			intendJoinTeam = jQuery(this).attr('title');
			Flux4.performRoadBlockerCheck(false, function (result) {
				if (result) {
					EMA.BB.getFluxUserData();
					(function () {
						if (typeof EMA.BB.nitro !== 'object') {
							setTimeout(arguments.callee, 300);
							return;
						} else {
							EMA.BB.nitro.callAPI('method=user.joinGroup&userId='+EMA.BB.ucid+'&groupName='+encodeURI(jQuery(this).attr('title')),'EMA.BB.u.JoinTeam');
						}
					})();
				}
			});
		}
	});
		
	/* Sorting JSON function - SH */
	var sortJsonArrayByProperty = function (objArray, prop, direction) {
	    if (arguments.length < 2) { throw new Error("sortJsonArrayByProp requires 2 arguments"); }
	    var direct = arguments.length > 2 ? arguments[2] : 1; //Default to ascending

	    if (objArray && objArray.constructor === Array) {
	        var propPath = (prop.constructor === Array) ? prop : prop.split(".");
	        objArray.sort(function (a, b) {
	            for (var p in propPath) {
	                if (a[propPath[p]] && b[propPath[p]]) {
	                    a = a[propPath[p]];
	                    b = b[propPath[p]];
	                }
	            }
	            // convert numeric strings to integers
	            a = a.match(/^\d+$/) ? +a : a;
	            b = b.match(/^\d+$/) ? +b : b;
	            return ((a < b) ? -1 * direct : ((a > b) ? 1 * direct : 0));
	        });
	    }
	};
	
	/* Flux4 SignIn/SignOut Listener, get Flux4 callback and trigger EMA.BB.getFluxUserData() again
	 * - Our way to refresh all BB components without reload entire page - SH */
	Flux4.addEventListener('signIn', function (eventContext, userContext) {
	    EMA.BB.getFluxUserData();
		if (intendJoinTeam.length>0) {
			$(".joinTeam[title='" + intendJoinTeam + "']").click();
		}
	});
	Flux4.addEventListener('signOut', function (eventContext, userContext) {
		intendJoinTeam='';
		EMA.BB.userGroup='';
		EMA.BB.getFluxUserData();
	});
	/* Flux4 shareContentCompleted/getFollowingStatsCompleted Listener, 
	 * get Flux4 callback and trigger originally from _base.gsp - SH */
	Flux4.addEventListener('shareContentCompleted', function (eventContext, userContext) {
		EMA.BB.u.FireBBAction('2013_ShareOrEmail');
	});
	Flux4.addEventListener('followCompleted', function (eventContext, userContext) {
		FO = jQuery.parseJSON(eventContext);
		if (FO.contentUri === MTVN.conf.sm4["ucid"]) {
			EMA.BB.u.FireBBAction('2013_LikeOrFollowMTVEMA');			
		} else if ($("body")[0].id === "artist-detail") {
			EMA.BB.u.FireBBAction('2013_LikeOrFollowArtist');
		}		
	});
	
	/*code for the social media referer - it  will add the ucid to the share widgets */	
	Flux4.addEventListener('ContextLoaded', function (eventContext, userContext) {
		//single share widget
		if (eventContext.user !== null) {
			_updateShareWidgetForSocialRefer(eventContext.user.ucid);
		}
	});
	
	var _updateShareWidgetForSocialRefer = function(ucid) {
		jQuery.each(MTVN.conf.sm4["widgets"].shareHorizontalPage.opts.elements, function (i, v) {
			if(v.id === "Facebook") {
				MTVN.conf.sm4["widgets"].shareHorizontalPage.opts.elements[i].ref = ucid;
			}
			if(v.id === "Twitter") {
				MTVN.conf.sm4["widgets"].shareHorizontalPage.opts.elements[i].permalinkExtension = 'fb_ref='+ucid;		
			}		
		});
		jQuery.each(MTVN.conf.sm4["widgets"].recruitFans.opts.elements, function (i, v) {
			if(v.id === "Facebook") {
				MTVN.conf.sm4["widgets"].recruitFans.opts.elements[i].ref = ucid;
			}
			if(v.id === "Twitter") {
				MTVN.conf.sm4["widgets"].recruitFans.opts.elements[i].permalinkExtension = 'fb_ref='+ucid;		
			}
		});

		$('#shareWidget,#recruitFans').sm4();	
	};
	

		
	
    return {
    	
    	login2BB: login2BB,
    	nitro: nitro,
    	nitroAnon: nitroAnon,
    	u: u,
    	au: au,
    	Widgets4ContextUser: Widgets4ContextUser,
    	userGroup: userGroup,
    	ucid: ucid,
    	userPoints: userPoints,
    	userLevelData: userLevelData,
    	profileUserGroupsData: profileUserGroupsData,
    	Bottom2ActiveGroupsData: Bottom2ActiveGroupsData,
    	voteGroupsMembers: voteGroupsMembers,
    	rankedNitroGroupLeaderData: rankedNitroGroupLeaderData,
    	allGroupList: allGroupList,
    	getFluxUserData: getFluxUserData,
    	final5teamsFlag: final5teamsFlag,    	
    	showUserProfile: showUserProfile,
    	ShareRefererAction: _shareRefererAction
    }
	
}());

jQuery(document).ready(function () {
	EMA.BB.getFluxUserData();
	//EMA.BB.login2BB();
});


