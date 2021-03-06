var monitor = angular.module('monitor', []);
monitor.directive('computer', function() {
    return {
        restrict: 'E',
        templateUrl: '/theme?mr=' + Math.random(),
        replace: true,
        link:function(scope, el, attr) {  
        	$(".miaoshu div").css("display","none");
            scope.showDetails =   function(event,i){
				$(event.target).parent().parent().parent().find(".miaoshu .miaoshu"+i).toggle(500).siblings().fadeOut();
			}
			
        }
    };
});

monitor.directive('smss',function(){
	return {
		restrict: 'E',
		replace: true,
		link:function(scope){
			
		},
		templateUrl: '/static/html/smss.html'
	}
})

monitor.directive('setting',function(){
	return {
		restrict: 'E',
		replace: true,
		link:function(scope){
			$('.alert').hide()
			scope.setting = function(){
				
			}
		},
		templateUrl: '/static/html/setting.html'
	}
})

monitor.service( 'computer', [ '$rootScope', function( $rootScope ) {
    var service = {
      	computers: [],
		total:0,
		active:0,
      	addComputer: function (data) {
      		
  			var nowComputer = undefined
			var activeNum = 0
        		for (var i = this.computers.length - 1; i >= 0; i--) {
				if(data.pc_id == this.computers[i].cid){
					nowComputer = i 
				}
				if(this.computers[i].hb != 0){
					activeNum++
				}
			}
			if (nowComputer != undefined) {
				if (data.bank_status != undefined) {
					this.computers[nowComputer].receiveData(data.bank_status)
				}
				if (data.hb != undefined) {
					this.computers[nowComputer].hb = data.hb
					this.setHbStyle(nowComputer)
				}
				if (data.ip != undefined) {
					this.computers[nowComputer].ip = data.ip
				}
			}else{
					var one = newComputer(data.pc_id)
      				if (data.bank_status != undefined) {
						one.receiveData(data.bank_status)
      				}
      				if (data.hb !=undefined) {
      					one.hb = data.hb
      				}
					this.setHbStyle(this.computers.push(one)-1)
			}

			this.active = activeNum
			this.total = this.computers.length
        	$rootScope.$broadcast( 'computers.update' );
      	},
      	setHbStyle:function(i){
      		var hb = this.computers[i].hb
      		if (hb == 0) {
				this.computers[i].hbStyle.background = "red"
			}else if (hb == 1) {
				this.computers[i].hbStyle.background = "#00FF7F"
			}
      	}
    }
    var websocket = new WebSocket("ws://"+WebSocketIP+"/ws");
	websocket.onopen = function(evt) { 
            alert('websocket连接成功') 
        }; 
    websocket.onclose = function(evt) { 
            alert('websocket断开连接') 
        }; 
    websocket.onmessage = function(evt) {
		var data = JSON.parse(evt.data)
		if(data instanceof Array ){
			for (var i=0;i<data.length;i++){
				service.addComputer(data[i])
			}
		}else{
			service.addComputer(data)
		}
    }; 
    websocket.onerror = function(evt) { 
            alert('websocket出现错误') 
        }; 
    return service
}]);

monitor.filter('hb_filter',function(){
	return function(input){
		var r = input == 0 ? 0 : 1 
		return r
	}
})

monitor.controller('computers',['$scope','$http','computer',function($scope,$http,computer){

	$scope.$on( 'computers.update', function( event ) {
        $scope.computers = computer.computers;
		$scope.total = computer.total
		$scope.active = computer.active
		for (var i = computer.computers.length - 1; i >= 0; i--) {
			var c = computer.computers[i]
			if (c.hb == 0) {
				$('#'+c.cid).collapse('hide')
			}else{
				$('#'+c.cid).collapse('show')
			}
		}
        $scope.$apply();
    }); 
	$scope.computers = computer.computers 
	$scope.showDetails = false
	$scope.total = 0
	$scope.active = 0
	$scope.settingRequestAnimation = false
    $scope.param = {}
	
	$http({
		url:'/setting',
		method:'get',
	}).success(function(data){
		$scope.param = data
		theme = data.theme
	}).error(function(data){
		alert("error")
	});
	

    $scope.submitSetting = function(){
		$scope.settingRequestAnimation = true
    		$http({
			url:'/setting',
			method:'post',
			data:$scope.param
		}).success(function(data){
			$scope.param = data
			setTimeout("",500)
			if(data.theme != theme){
					window.location.reload();
			}
			$scope.settingRequestAnimation = false
		}).error(function(data){
			alert("error")
		});
    }
    $scope.submitDefalutSetting = function(){
		$scope.settingRequestAnimation = true
    		$http({
			url:'/setting/default',
			method:'post'
		}).success(function(data){
			if(data){
				$scope.param = data
				setTimeout("",1000)
				if(data.theme != theme){
					window.location.reload();
				}
				$scope.settingRequestAnimation = false
			}
		}).error(function(data){
			alert("error")
		});
    }
	$scope.HideSettingAnimation = function(data){
		if(data.theme != theme){
			window.location.reload();
		}
		$scope.settingRequestAnimation = false
	}
	$scope.hideAttr = function(k){
	    	var hides = ['sid','bid','step']
	    	for (var i = hides.length - 1; i >= 0; i--) {
	    		if (k == hides[i]) {
	    			return true
	    		}
	    	}
	    	return false
	    }

	
}])

var theme = 0
var animateLengths = [140,70,58,0]

var newComputer = function(cid){
	var computer = {
		s:0,
		hb:1, //heartbeat
		hbStyle:{
			background:"blue"
		},
		ip:undefined,
		cid:cid,
		sid:undefined,
		bid:undefined,
		nowData:{},
		hository:new Array(6),
		spider:[],
		receiveData : function(data){
			if (typeof data == 'string'){
				var data = JSON.parse(data)
			}
			if(data.step == 0 || this.sid != data.sid){
					this.sid = data.sid
					this.bid = data.bank_name
					$('#sid').html(data.sid)
					$('#bid').html(data.bid)
					this.hository = new Array(6)
					this.initFlowSheet()
				}
			this.s = data.step
			this.hository[data.step] = data
			this.loadBegin()
			if (data.step < this.s) {}else{this.startStep(88)}
		},
		startStep : function(bfb){
			var i = this.s
			$("#"+this.cid+"_percent_"+i).text(bfb);
			w =bfb*animateLengths[theme]/100;
			$("#"+this.cid+"_animate_img_"+i).animate({width:w+"px"},bfb*100)
		},
		loadBegin : function(){
			for(i=0;i<this.s;i++){
				$("#"+this.cid+"_animate_img_"+i).stop(true,true);
				$("#"+this.cid+"_animate_img_"+i).animate({width:animateLengths[theme]+"px"},"fast")
				$("#"+this.cid+"_percent_"+i).text(100);
			}
		},
		initFlowSheet : function(){
		
			for(var i=1 ; i<=6 ; i++){
				$("#"+this.cid+"_animate_img_"+i).animate({width:0+"px"})	
				$("#"+this.cid+"_percent_"+i).text(0);
			}
		}
	}
	return computer
}

var newSpider = function(bid){
	return {
		bank:bid,
		banks:new Array(6),
		record:function(data){
			hository[data.step] = data
		}
	}
}
