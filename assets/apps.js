

// 全局初始化
(() => {
    // JS 存在性检测
    const documentElement = document.documentElement
    documentElement.classList.replace("nojs", "hasjs")
    // 自动更换主题显示
    // 注意：此处使用 JS 处理主题更换显示是为了保留自定义更换主题的能力，尽管我并不想加上切换主题的按钮
    const scheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    documentElement.classList.replace("light", scheme)
})();

// 浏览器特性检测
// 参考链接 https://stackoverflow.com/a/9851769
(() => {
    // opera 8.0+
    const is_opera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0
    // firefox 1.0+
    const is_firefox = typeof InstallTrigger !== 'undefined'
    // Safari 3.0 + "[object HTMLElementConstructor]" 
    const is_safari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && window['safari'].pushNotification))
    // Internet Explorer 6-11
    const is_ie = /*@cc_on!@*/false || !!document.documentMode
    // edge 20+ (EdgeHTML/2014-2019)
    const is_edge_html = !is_ie && !!window.StyleMedia
    // chrome
    const is_chrome = !!window.chrome
    // Edge (Based on Chromium/2019-now)
    const is_edge = is_chrome && (navigator.userAgent.indexOf("Edg") != -1)
    // blink engine
    const is_blink = (is_chrome || is_edge || is_opera) && !!window.CSS
    // webkit engine
    const is_webkit = /webkit/i.test(navigator.userAgent)
    // gecko engine
    const is_gecko = /gecko/i.test(navigator.userAgent)
    // presto engine
    const is_presto = /presto/i.test(navigator.userAgent)
    // mobile
    const is_mobile = /ipad|iphone|android/i.test(navigator.userAgent)
    // desktop
    const is_desktop = /windows|linux|macos|cros/i.test(navigator.userAgent)

    // 浏览器名称检测
    window.browser = {
        chrome: is_chrome,
        edge: is_edge,
        firefox: is_firefox,
        safari: is_safari,
        opera: is_opera,
        ie: is_ie,
        edge_html: is_edge_html,
    }
    // 浏览器引擎检测
    window.browser_engine = {
        blink: is_blink,
        webkit: is_webkit,
        trident: is_ie,
        edgeHTML: is_edge_html,
        gecko: is_gecko,
        presto: is_presto,
    }
    // 浏览器平台检测
    window.browser_platform = {
        mobile: is_mobile,
        desktop: is_desktop, 
    }

})();

// 自动检测浏览器按钮实现 js-install/js-download
(() => {
    
    // apps
    if (typeof window.apps === "undefined") return

    let browser = "chrome"
    if (window.browser.edge) browser = "edge"
    else if (window.browser.firefox || window.browser.gecko) browser = "firefox"
    else if (window.browser.safari) browser = "safari"
    else if (window.browser.opera) browser = "opera"
    else browser = "chrome"

    // buttons for js-install
    Array.from(document.querySelectorAll(".js-install")).map(element => {
        if (!element) return
        const titled = browser[0].toUpperCase() + browser.slice(1)
        element.setAttribute("href", window.apps[browser])
        element.setAttribute("title", `Get Keptab from ${titled}, It's Free`)
        element.innerHTML = `Get Keptab for <strong>${titled}</strong>`
    })

    // buttons for js-download
    Array.from(document.querySelectorAll(".js-download")).map(element => {
        if (!element) return
        const titled = browser[0].toUpperCase() + browser.slice(1)
        element.setAttribute("href", window.apps[browser])
        element.setAttribute("title", `Download Keptab from ${titled}, It's Free`)
        element.innerHTML = `Download Keptab for <strong>${titled}</strong>`
    })

})();

// 将 OneTab 数据与 Keptab 的数据相互转换
(() => {

    /**
     * 将 OneTab 导出数据转换到 Keptab JSON 格式
     * @param {string} lists OneTab 导出数据/字符串
     */
    function toKeptab(lists) {
        const NOW = Date.now()
        return lists.split("\n\n")
            .filter(list => list.trim())
            .map(list => list.split("\n")
                .filter(tab => tab)
                .map(tab => {
                    const [url, ...title] = tab.split("|")
                    return {
                        url: url.trim(),
                        title: title.join("").trim(),
                        favIconUrl: "",
                        pinned: false,
                        muted: false
                    }
                })
            ).map((tabs, idx) => {
                // 以当前时间按 idx 顺序往后排列，为了防止秒数相同，此处直接顺序递减
                const now = NOW - (idx * 1000) 
                const urls = tabs.map(tab => tab.url)
                return {
                    _id: now,
                    title: "",
                    tabs: tabs,
                    urls: urls,
                    tags: [],
                    time: now,
                    lock: false,
                    star: false
                }
            })
    }

    /**
     * 将 Keptab JSON 格式数据导出为 OneTab 文本格式
     * @param {Array<>} lists Keptab 导出数据/JSON
     */
    function fromKeptab(lists) {
        return lists.filter(list => list)
            .map(list => {
                const tabs = list.tabs
                if (tabs.length) {
                    return tabs.map(tab => `${tab.url} | ${tab.title || ""}`).join("\r\n")
                } else {
                    return null
                }
            })
            .filter(list => list)
            .join("\n\n")
    }

    // migrate to keptab
    const toKeptabBtn = document.getElementById("js-keptab-btn")
    toKeptabBtn && toKeptabBtn.addEventListener("click", (event) => {

        const data = document.getElementById("js-onetab-data")
        if (!data.value) {
            return alert("Please paste the OneTab export content to the blank textarea!")
        }

        let lists = {}
        try {
            lists = toKeptab(data.value)
        } catch (error) {
            console.log("onetab-to-keptab:", error)
            return alert('The OneTab export content parse error, please review your content')
        }

        const blob = new Blob([ JSON.stringify(lists, null, 2) ], { type: "text/json" })
        const name = `onetab-to-keptab-${ Date.now() }.json`
        
        // download as file
        const link = document.createElement("a")
        link.download = name
        link.href = window.URL.createObjectURL(blob)
        link.dataset.downloadurl = ["text/json", link.download, link.href].join(":")
        const click = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true
        })
        link.dispatchEvent(click)
        link.remove()

    })

    // export onetab format
    const fromKeptabBtn = document.getElementById("js-onetab-btn")
    const fromKeptabBtnText = fromKeptabBtn && fromKeptabBtn.textContent
    fromKeptabBtn && fromKeptabBtn.addEventListener("click", (event) => {

        const data = document.getElementById("js-keptab-data")
        if (!data.value) {
            return alert("Please paste the Keptab JSON content to the blank textarea!")
        }

        let lists = ""
        try {
            lists = fromKeptab(JSON.parse(data.value))
        } catch (error) {
            console.log("keptab-to-onetab:", error)
            return alert("The Keptab export content parse error, please review your content")
        }

        fromKeptabBtn.textContent = "Copied!"
        window.setTimeout(() => {
            fromKeptabBtn.textContent = fromKeptabBtnText
        }, 2000)

        return navigator.clipboard.writeText(lists)

    })

})();