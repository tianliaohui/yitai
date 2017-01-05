/**
 * Created by liaohui1080 on 14/10/19.
 */
$(function () {

    mydata = new Mydata;

    $(window).resize(function () {
        myview.chicun();
    });

    ajaxTime = mydata.get("ajaxTime") * 1000;//定义获取数据的间隔时间 常量

    shanyaoTime = mydata.get("shanyaoTime").time; //定义动画闪耀的间隔时间 常量
    shanyaoKaiguan = mydata.get("shanyaoTime").kaiguan; //定义动画闪耀的开关 常量

    //定数ajax 取数据
    setTimeout(function () {

        mydata.ajaxBaojing();
        setTimeout(arguments.callee, ajaxTime);
    }, ajaxTime);


    myrouter = new Myrouter;
    Backbone.history.start();

    myview = new Myview({model: mydata});


});


Mydata = Backbone.Model.extend({
    defaults: {
        "baojing": "", //这里存储ajax穿过来的报警和坐标混和以后的完整数据
        "zuobiao": dataZuobiao,    //坐标数据, 默认显示 东胜矿区的数据
        "ajaxTime": 60,     //ajax 取数据间隔时间 秒
        "diqu": "东胜",   //默认显示的地区
        "imageDitu": "images/ditu3.png",  //默认显示东胜地区地图
        "shanyaoTime": {
            "kaiguan": 1, //是否闪耀的开关,如果等于0 则不闪耀
            'time': 1000   //闪耀间隔的时间 毫秒
        }
    },
    initialize: function () {


        this.on("change:baojing", function () {
            arrayBaojing = new Array();
            _.map(mydata.get("zuobiao"), function (val, key) {

                _.map(mydata.get("baojing").data, function (bjVal, bjKey) {

                    if (val.kuangqu.id == bjVal.ID) {
                        val['baojing'] = bjVal;
                        val.name.name = bjVal.Name;//把服务器上的矿区名字赋值到现在的数据里
                    }

                });
                arrayBaojing[key] = val;

            });

            var abc = {
                "zhengchang": mydata.get("baojing").zhengchang,
                "jinggao": mydata.get("baojing").jinggao,
                "cuowu": mydata.get("baojing").cuowu,
                "miaoshu": mydata.get("baojing").miaoshu,
                "data": arrayBaojing
            };

            mydata.set({"baojing": abc});

        })
    },

    //获取服务器端的报警数据
    ajaxBaojing: function () {

        $("#data_shuaxin").text($("#data_shuaxin").attr("title"));

        this.fetch({
            //url后面加时间戳防止浏览器缓存
            url: mydata.get("ajaxUrl"),
            success: function (m, msg) {
                //把数据赋值给模型
                mydata.set({"baojing": msg});
                $("#data_shuaxin").text("刷新");
            },
            error: function () {

                $("#data_shuaxin").text("连接失败");
            }
        });
    }


});

Myrouter = Backbone.Router.extend({
    routes: {
        "shuaxin": "shuaxin",
        "qihuanDiqu/:kuangqu": "qitaDiqu",


        "*actions": "defaultRoute"

    },
    initialize: function () {

    },
    defaultRoute: function () {
        this.navigate("/shuaxin", {trigger: true});//自动跳转
    },
    shuaxin: function () {


        if (mydata.get("diqu") == "东胜") {
            this.navigate("/qihuanDiqu/dongsheng", {trigger: true});//自动跳转
        } else if (mydata.get("diqu") == "新疆") {
            this.navigate("/qihuanDiqu/xinjiang", {trigger: true});//自动跳转
        }


        mydata.ajaxBaojing();
    },
    qitaDiqu: function (kuangqu) {

        if (kuangqu == 'xinjiang') {
            mydata.set({
                "zuobiao": dataZuobiaoXinjiang,
                "imageDitu": "images/xinjiang.png",
                "diqu": "新疆",
                "ajaxUrl": 'xinjiang.json?time=' +
                    new Date().getTime()
            });
        } else if (kuangqu == 'dongsheng') {
            mydata.set({
                "zuobiao": dataZuobiao,
                "imageDitu": "images/ditu5.png",
                "diqu": "东胜",
                "ajaxUrl": 'aaaa.json?time=' +
                    new Date().getTime()
            });

        }

        mydata.ajaxBaojing();
    }
});


Myview = Backbone.View.extend({
    el: $("body"),

    zuobiao: dataZuobiao, //获取 zuobiao.js 文件里的默认坐标数据

    //选择矿区模板
    kuangqu: _.template($('#moban_kuangqu').html()),
    //装载矿区的容器
    rongqiKuangqu: $("#rongqi_kuangqu"),

    //煤矿模板
    meikuang: _.template($('#moban_meikuang').html()),
    //装载煤矿的容器
    rongqiMeikuang: $("#rongqi_meikuang"),

    //煤矿报警总状态
    baojingZong: _.template($('#moban_baojing_zong').html()),
    //装载煤矿报警总状态的容器
    rongqiBaojingZong: $("#rongqi_baojing_zong"),

    events: {

    },

    initialize: function () {
        this.chicun().read();

        this.listenTo(this.model, 'change:baojing', this.read);//数据改变的时候触发

        $("#rongqi_meikuang").on("click", "li", function () {
            $(this).find("p").toggle();
        });


        //报警数统计 显示隐藏
        $(".tishi-zong")
            .on("mouseover", "li", function () {
                $(this).find(".tishi").show();

            })
            .on("mouseout", "li", function () {
                $(this).find(".tishi").hide();
            });

    },


    //加载矿区视图模板
    read: function () {
        //console.log(JSON.stringify(mydata.imageDitu));
        if (this.model.get("baojing")) {
            // console.log(JSON.stringify(this.model.get("imageDitu")));
            moban_data = this.model.get("baojing").data; //读取模型坐标数据
            //console.log(JSON.stringify(moban_data[0]["name"]['tishiZuobiao']["y"]));
            this.rongqiKuangqu.html(this.kuangqu(moban_data));//给矿区模板赋值
            this.rongqiMeikuang.html(this.meikuang(moban_data));//给煤矿模板赋值
            this.rongqiBaojingZong.html(this.baojingZong(this.model.get("baojing")));//给报警数统计模板赋值
            $("#miaoshu_jituan").html(this.model.get("baojing").miaoshu);//给集团公司 描述赋值
            $("#ditu").attr({"src": this.model.get("imageDitu")});//给矿区地图赋值

            //判断显示那个矿区的右下角示意图
            if (this.model.get("diqu") == "东胜") {
                $(".diqu-xinjiang").show();
                $(".diqu-dongsheng").hide();
            } else if (this.model.get("diqu") == "新疆") {
                $(".diqu-dongsheng").show();
                $(".diqu-xinjiang").hide();
            }


            this.baojing();

        }


        return this;
    },


    //报警函数
    baojing: function () {

        var dataBaojing = this.model.get("baojing").data;
        _.each(dataBaojing, function (val) {
            //console.log(JSON.stringify(val.baojing.baojing))

            var meikuangID = $("#meikuang_" + val.baojing.ID + " div");//获取右侧煤矿的id

            var kuangquID = $("#kuangqu_" + val.baojing.ID);//获取左侧矿区的id

            var baojing = val.baojing.baojing;//报警参数  1=错误  2= 警告  0=正常


            //给矿区模板增加 提示
            kuangquID.find(".zuobiao-dian").mouseover(function () {
                kuangquID.css({"z-index": 0});
                kuangquID.find(".tishi").show();
                kuangquID.css({"z-index": 200});
            });
            kuangquID.find(".zuobiao-dian").mouseout(function () {
                kuangquID.css({"z-index": 0});
                kuangquID.find(".tishi").hide();

            });

            myview.bianseMeikuang(baojing, meikuangID);
            myview.bianseKuangqu(baojing, kuangquID);

        });
    },

    //煤矿改变颜色
    bianseMeikuang: function (baojing, meikuangID) {

        if (baojing == 1) {
            this.shanyao(meikuangID, "jinggao");
        } else if (baojing == 2) {
            this.shanyao(meikuangID, "cuowu");
        }
    },

    //矿区改变颜色
    bianseKuangqu: function (baojing, kuangquID) {

        var bianseCss;
        //判断新疆和东胜矿区使用的变色css,, 由于新疆的矿区背景图大,所以用不同的css
        if (this.model.get("diqu") == "东胜") {
            bianseCss="zuobiao-bianse";
        } else if (this.model.get("diqu") == "新疆") {
            bianseCss="zuobiao-bianse-xinjiang";
        }

        if (baojing) {
            this.shanyao(kuangquID, bianseCss);
        } else {
            kuangquID.removeClass(bianseCss);
        }


    },


    //闪耀动画
    shanyao: function (divID, cssName) {

        if (shanyaoKaiguan) {
            setTimeout(function () {
                var zhuangtai = divID.data("zhuangtai");
                if (!zhuangtai) {
                    divID.addClass(cssName);
                    divID.data({"zhuangtai": 1});
                } else {
                    divID.removeClass(cssName);
                    divID.data({"zhuangtai": ""});
                }
                setTimeout(arguments.callee, shanyaoTime);
            }, shanyaoTime);
        } else {
            divID.addClass(cssName);
        }
    },


    //显示 鼠标当前的坐标位置  更新窗口变化时也没元素的尺寸
    chicun: function () {

        $(".ditu-img").width($(window).width() - 255).height($(window).height());
        $(".window_height").height($(window).height());
        $(".meikuang").height($(window).height() - 75);

        $(".zuo-neirong")
            .on('mousemove', function (e) {
                var zbKuan = $(this).width();
                var zbGao = $(this).height();
                $(".zuobiao-xianshi").text(
                        'X' + parseInt((e.clientX / zbKuan) * 100) + '-Y' + parseInt((e.clientY / zbGao) * 100)
                ).css({
                        top: parseInt((e.clientY / zbGao) * 100 + 1) + '%', left: parseInt((e.clientX / zbKuan) * 100 + 2) + '%'
                    });


            });

        return this;
    }
});