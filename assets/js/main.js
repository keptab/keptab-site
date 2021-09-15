/* (c) 2021 Keptab. All rights reserved */


// JS 检测，另外意义上的 noscript
(function() {
    document.documentElement.classList.replace('nojs', 'hasjs')
})();

// 同时使用特性检测和 User-Agent 检测（两者是或关系）来测试浏览器
// 参考链接 https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
var $browser = (function() {

    var userAgent = window.navigator.userAgent.toLowerCase()
    // Opera 8.0+
    var opera = (!!window.opr && !!opr.addons) || !!window.opera || userAgent.indexOf(' opr/') >= 0
    // Firefox 1.0+
    var firefox = typeof InstallTrigger !== 'undefined' || userAgent.indexOf("firefox") >= 0
    // Safari 3.0+ "[object HTMLElementConstructor]" 
    var safari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification))
    // Internet Explorer 6-11
    var ie = /*@cc_on!@*/false || !!document.documentMode
    // Edge 20+
    var edge = !ie && !!window.StyleMedia
    // Chrome 1 - 90
    var chrome = !!window.chrome && userAgent.indexOf("chrome") >= 0
    // Edge (based on chromium) dev or canary
    var edgeChromium = chrome && userAgent.indexOf("edg") >= 0
    // Blink engine
    var blink = (chrome || opera) && !!window.CSS
    // Webkit engine
    var webkit = userAgent.indexOf("webkit") >= 0

    return {
        browser: {
            chrome: chrome,
            edge: edge,
            edgeChromium: edgeChromium, // Edge 这货比较特殊
            firefox: firefox,
            safari: safari,
            opera: opera,
            ie: ie
        },
        engine: {
            EdgeHTML: edge && !edgeChromium,
            Blink: blink,  // Opera 12.16 - 15.0
            Trident: ie,
            Presto: false, // Opera 7.0 - 12.18
            gecko: firefox,
            webkit: chrome || edgeChromium || webkit
        }
    }

})();

// 自动检测 js-download/js-install 按钮的实现
(function() {

    // 没有传入 keptabApps 就直接退出
    if (typeof window.keptabApps === 'undefined') return

    var browsers = []
    for (var name in window.keptabApps) {
        browsers.push(name)
    }

    function render(name, link) {
        // 首字符大写！
        name = name.charAt(0).toUpperCase() + name.slice(1)
        // 如果对应的 DOM 不存在就不要往下执行啦
        var install = document.getElementById('js-install')
        if (install) {
            install.setAttribute('href', link)
            install.setAttribute('title', 'Add Keptab for ' + name + ", It's Free")
        }
        var download = document.getElementById('js-download')
        if (download) {
            download.innerHTML = 'Get Keptab for <strong>' + name + '</strong>'
            download.setAttribute('href', link)
            download.setAttribute('title', 'Get Keptab for ' + name + ", It's Free")
        }
    }

    // keptab 支持的浏览器版本
    function browser(name) {
        if ($browser.browser.firefox) return 'firefox' 
        if ($browser.browser.safari) return 'safari'
        if ($browser.browser.opera && !$browser.engine.Blink) return 'opera'
        if ($browser.browser.edgeChromium) return 'edge'
        if ($browser.browser.chrome) return 'chrome'
        return 'chrome'
    }
    
    var name = browser()
    if (browsers.includes(name)) {
        render(name, keptabApps[name].link)
    } else {
        // 默认显示 Chrome 的下载链接
        render('chrome', keptabApps.chrome.link)
    }

})();

// OneTab 数据导入到 Keptab 的实现
(function() {

    // 如果不是 migrate 页面就直接退出
    var button = document.getElementById('js-onetab-button')
    if (!button) return

    function onetab(lists) {
        return lists.split('\n\n')
            .filter(list => list.trim())
            .map(list => list.split('\n')
                .filter(tab => tab)
                .map(tab => {
                    const [url, ...title] = tab.split('|')
                    // 此处其实需要检验一下 URL 的正确性
                    return {
                        url: url.trim(),
                        title: title.join().trim(),
                        favIconUrl: '',
                        pinned: false,
                        muted: false
                    }
                })
            ).map((tabs, index) => {
                const now = Date.now() - index
                const urls = tabs.reduce((urls, tab) => {
                    urls.push(tab.url)
                    return urls
                }, [])
                return {
                    _id: now,
                    title: '',
                    tabs: tabs,
                    urls: urls,
                    tags: [],
                    time: now,
                    lock: false,
                    star: false
                }
            })
    }

    // https://gist.github.com/krishpop/8a954b171a5403117bf0f2fdda0a8e90
    button.addEventListener('click', function() {
        var textarea = document.getElementById('js-onetab-textarea')
        if (!textarea.value) {
            alert('Please paste the OneTab export content to the blank textarea') // 提示一下需要填写
            return
        }
        try {
            var lists = onetab(textarea.value)
        } catch (error) {
            alert('The OneTab export content parse error, please review your content')
            return
        }
        var download = document.getElementById('js-onetab-download')
        download.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(lists, null, 2))}`)
        download.setAttribute('download', `onetab-to-keptab-${ Date.now() }.json`)
        download.click()
        alert('File has download and review this before import into Keptab')
    })

})();