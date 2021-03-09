//-------------------------------------------------
/* 
COMP 3512 Assign1
Liam Eisenberg

Known Issues:
--Map finally works after fixing billing issues, but refuses to set a location
--obvious formatting issues
--Charts were not even attempted, didn't have time
--divs for charts were impossible to hide/unhide, not sure why
--I left a few console.logs on purpose to prove that data is coming from storage vs fetch etc.
--The filter box seems a bit screwy bit I can't find a specific bug with it
--Didn't have time to get the credits pop up written, but it is in the HTML
--Code is poorly structured in general, easy to break
*/
//-----------------------------------------------



let map;

function initMap() {
    map = new google.maps.Map(document.querySelector('div.d'), {
        center: { lat: 41.89474, lng: 12.4839 },
        mapTypeId: 'satellite',
        zoom: 18
    });
}

function thousands_separators(num) {
    var num_parts = num.toString().split(".");
    num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return num_parts.join(".");
    //This function brought to you by https://www.w3resource.com/javascript-exercises/javascript-math-exercise-39.php
}


document.addEventListener("DOMContentLoaded", function() {
    const chartViews = document.querySelectorAll(".chartView");
    const homes = document.querySelectorAll(".home");

    //Hides/unhides boxes between the main and chart views
    function hideDatBoi(elems) {
        for (let e of elems) { e.classList.toggle('hidden') };
    }

    hideDatBoi(chartViews); //Hide on first load
    let stockDataDivInit = document.querySelector(".f>div>table"); //hide stock data chart on load
    stockDataDivInit.innerHTML = "";

    buttonSelectinator("#viewCharts");
    buttonSelectinator("#close");

    let scrollListLoading = document.querySelectorAll(".scrollBox>table");
    for (s of scrollListLoading) {
        s.innerHTML = "";
        let loader = document.createElement("div");
        loader.className = "loader";
        s.appendChild(loader);
    }

    let companiesDat;

    //Companies API call
    const companiesAPI = 'http://www.randyconnolly.com/funwebdev/3rd/api/stocks/companies.php';
    const stockAPI = 'https://www.randyconnolly.com/funwebdev/3rd/api/stocks/history.php?symbol=';

    if (localStorage.getItem("companyData") == null) {
        fetch(companiesAPI)
            .then((resp) => {
                if (resp.ok) {
                    return resp.json();
                }
            })
            .then(data => {
                if (data != undefined) {
                    localStorage.setItem("companyData", JSON.stringify(data.sort((i, x) => (i.name > x.name) ? 1 : (i.name === x.name) ? 1 : -1)));
                    let dataString = localStorage.getItem("companyData");
                    companiesDat = JSON.parse(dataString);
                    console.log("Companies Data retrieved from fetch")
                    companiesList(companiesDat);
                }
            })
    } else {
        let dataString = localStorage.getItem("companyData");
        companiesDat = JSON.parse(dataString);
        if (companiesDat != null) {
            console.log("Companies Data retrieved from storage")
            companiesList(companiesDat);
        }
    }

    //only functions from this point on

    function stockData(stocks) {
        //Put stocks into table
        stockTablifier(stocks);
        //Resorting
        sortMaster(stocks);
    }

    let lastSort;

    function sortMaster(stocks) {
        let sorters = document.querySelectorAll("#stockTable>tr>th");


        function sortE(sorters, stocks) {

            for (s of sorters) {
                s.addEventListener("click", (e) => {
                    if (e.target.textContent != lastSort) {
                        console.log("sorted forwards");
                        lastSort = e.target.textContent;
                        stockDataSorter(lastSort, false, stocks);
                        //document.querySelector("#stockTable>tr>th:nth-child(1)")
                        sortMaster(stocks);
                    } else {
                        console.log("sorted backwards");
                        stockDataSorter(lastSort, true, stocks);
                        lastSort = "";
                        sortMaster(stocks);
                    }
                })
            }
            return stocks;
        }
        stockTablifier(stocks);
        sorters = document.querySelectorAll("#stockTable>tr>th");
        sortE(sorters, stocks);
    }

    function stockDataSorter(sortBy, revBool, stocks) {
        let sortedStocks;
        let cat = [];
        if (stock != undefined) {
            if (sortBy == "Date") {
                sortedStocks = stocks.sort((i, x) => (i.date > x.date) ? 1 : (i.date === x.date) ? 1 : -1);
                //inspired by https://flaviocopes.com/how-to-sort-array-of-objects-by-property-javascript/
                //if idate>xdate ret 1, else if equal ret 1, else ret -1
            } else if (sortBy == "Open") {
                sortedStocks = stocks.sort((i, x) => (i.open > x.open) ? 1 : (i.open === x.open) ? 1 : -1);
            } else if (sortBy == "Close") {
                sortedStocks = stocks.sort((i, x) => (i.close - x.close));
            } else if (sortBy == "Low") {
                sortedStocks = stocks.sort((i, x) => (i.low - x.low));
            } else if (sortBy == "High") {
                sortedStocks = stocks.sort((i, x) => (i.high - x.high));
            } else if (sortBy == "Volume") {
                sortedStocks = stocks.sort((i, x) => (i.volume - x.volume));
            }
            (revBool) ? sortedStocks.reverse(): sortedStocks;
            //if reverse is true, reverse sortedStocks
            return sortedStocks;
        } else {
            console.log("Stocks array undefined at stockDataSorter");
        }
    }

    function stockTablifier(stocks) {
        let stockDataDiv = document.querySelector(".f");

        if (stocks != null) {
            stockDataDiv.innerHTML = "";
            //replace title
            let stockDataTitle = document.createElement("h3");
            stockDataTitle.innerHTML = "Stock Data";
            stockDataDiv.appendChild(stockDataTitle);
            //replace view charts button
            let chartsButton = document.createElement("button");
            chartsButton.innerHTML = "View Charts";
            chartsButton.id = "viewCharts";
            stockDataDiv.appendChild(chartsButton);
            buttonSelectinator("#viewCharts");
            //scrollbox
            let scrollBox = document.createElement("div");
            scrollBox.className = "scrollBox";
            let scrollBoxTable = document.createElement("table");
            scrollBoxTable.className = "scrollTableStock";
            scrollBoxTable.id = "stockTable";
            //create table headers
            let tr = document.createElement("tr");
            let headers = ["Date", "Open", "Close", "Low", "High", "Volume"];

            for (let i = 0; i < headers.length; i++) {
                let th = document.createElement("th");
                th.innerHTML = headers[i];
                th.id = "stock" + headers[i];
                tr.appendChild(th);
            }
            scrollBoxTable.appendChild(tr); //append header row to table

            for (stock of stocks) {
                let stockCatArray = [stock.date, stock.open, stock.close, stock.low, stock.high, stock.volume]
                let tr = document.createElement("tr");
                for (let i = 0; i < stockCatArray.length; i++) {
                    let td = document.createElement("td");
                    let num = stockCatArray[i];
                    (i > 0) ? td.innerHTML = thousands_separators(parseFloat(num).toFixed(2)): td.innerHTML = num;
                    //If not on the date cell, convert string to float, 2 dec pts, add 100's commas, set to cell innerhtml
                    tr.appendChild(td);
                }
                scrollBoxTable.appendChild(tr);
            }
            scrollBox.appendChild(scrollBoxTable); //append table to scrollbox div
            stockDataDiv.appendChild(scrollBox); //append scrollbox div to box f div
            avgMinMax(stocks);
        } else {
            let noStocks = document.createElement("p");
            noStocks.innerHTML = "Unfortunately there is no stock data for this company";
            stockDataDiv.appendChild(noStocks);
        }
    }

    function avgMinMax(stocks) {
        let oavg = 0;
        let omin = 1000;
        let omax = 0;
        let cavg = 0;
        let cmin = 1000;
        let cmax = 0;
        let lavg = 0;
        let lmin = 1000;
        let lmax = 0;
        let havg = 0;
        let hmin = 1000;
        let hmax = 0;
        let vavg = 0;
        let vmin = 1000000000;
        let vmax = 0;
        for (let i = 0; i < stocks.length; i++) {
            let o = stocks[i].open;
            let c = stocks[i].close;
            let l = stocks[i].low;
            let h = stocks[i].high;
            let v = stocks[i].volume;
            o = parseFloat(o);
            c = parseFloat(c);
            l = parseFloat(l);
            h = parseFloat(h);
            v = parseFloat(v);
            oavg += o;
            cavg += c;
            lavg += l;
            havg += h;
            vavg += v;
            omin = (o < omin) ? o : omin;
            cmin = (c < cmin) ? c : cmin;
            lmin = (l < lmin) ? l : lmin;
            hmin = (h < hmin) ? h : hmin;
            vmin = (v < vmin) ? v : vmin;
            omax = (o > omax) ? o : omax;
            cmax = (c > cmax) ? c : cmax;
            lmax = (l > lmax) ? l : lmax;
            hmax = (h > hmax) ? h : hmax;
            vmax = (v > vmax) ? v : vmax;
            if (i == stocks.length - 1) {
                oavg = oavg / i;
                cavg = cavg / i;
                lavg = lavg / i;
                havg = havg / i;
                vavg = vavg / i;
            }
        }
        let avgVars = [oavg, cavg, lavg, havg, vavg.toFixed(0)];
        let minVars = [omin, cmin, lmin, hmin, vmin.toFixed(0)];
        let maxVars = [omax, cmax, lmax, hmax, vmax.toFixed(0)];
        let cbox = document.querySelector(".c");
        cbox.innerHTML = "";
        let cdiv = document.createElement("div");
        let avgMinMaxTable = document.createElement("table");
        avgMinMaxTable.className = "ctable";
        avgMinMaxTable.id = "avgMinMaxTable";
        //top row
        let tr1 = document.createElement("tr");
        let headers = ["Open", "Close", "Low", "High", "Volume"]
        tr1.appendChild(document.createElement("th")); //one empty cell
        for (let i = 0; i < headers.length; i++) {
            let th = document.createElement("th");
            th.innerHTML = headers[i];
            tr1.appendChild(th);
        }
        avgMinMaxTable.appendChild(tr1);
        let rowHeaders = ["Avg", "Min", "Max"];
        for (let i = 0; i < rowHeaders.length; i++) {
            let row = document.createElement("tr");
            let rowHead = document.createElement("th");
            rowHead.innerHTML = rowHeaders[i];
            row.appendChild(rowHead);
            //put stuff in row
            if (i == 0) {
                for (let i = 0; i < avgVars.length; i++) {
                    let td = document.createElement("td");
                    (i == avgVars.length - 1) ? td.innerHTML = `$${thousands_separators(avgVars[i])}`: td.innerHTML = avgVars[i].toFixed(2);
                    //If last var (volume) add $ and thousands commas, don't toFixed()
                    row.appendChild(td);
                }
            } else if (i == 1) {
                for (let i = 0; i < minVars.length; i++) {
                    let td = document.createElement("td");
                    (i == minVars.length - 1) ? td.innerHTML = `$${thousands_separators(minVars[i])}`: td.innerHTML = minVars[i].toFixed(2);
                    row.appendChild(td);
                }
            } else if (i == 2) {
                for (let i = 0; i < maxVars.length; i++) {
                    let td = document.createElement("td");
                    (i == maxVars.length - 1) ? td.innerHTML = `$${thousands_separators(maxVars[i])}`: td.innerHTML = maxVars[i].toFixed(2);
                    row.appendChild(td);
                }
            }
            avgMinMaxTable.appendChild(row);
        }
        cdiv.appendChild(avgMinMaxTable);
        cbox.appendChild(cdiv);
    }

    function companiesList(companies) {
        cLister(companies); //Populate companies list
        cListener(companies); //add event listeners to all the companies

        //filter
        let input = document.querySelector("#filterText");
        let clearButton = document.querySelector("#clear");
        clearButton.addEventListener("click", () => {
            input.value = "";

            cLister(companies);
            cListener(companies);
        });
        let goButton = document.querySelector("#go");
        goButton.addEventListener("click", (e) => {
            companyFilter(input.value, companies);
        });

    }

    function cListener(companies) {
        let companyLinks = document.querySelectorAll("#companiesTable>tbody");
        for (let c of companyLinks) {
            c.addEventListener("click", (e) => {
                //get company object
                let companyObj = companies.find(company => company.name == e.target.textContent);
                //map
                // let latLng = new google.maps.LatLng(companyObj.latitude, companyObj.longitude);
                // map.setCenter(latLng);
                // let longitude = companyObj.longitude;
                // let latitude = companyObj.latitude;
                // longitude = parseFloat(longitude);
                // latitude = parseFloat(latitude);
                // // map.setCenter({ lat: companyObj.latitude, lng: companyObj.longitude });
                // map.setCenter(new google.maps.LatLng(-34, 151));
                // map.setZoom(18);
                //This doesn't work and I can't figure out why 
                //(no, there's no error in the console no matter how hard I try)

                let stonk = stockAPI + companyObj.symbol;
                let stockListLoading = document.querySelector("#stockTable");

                stockListLoading.innerHTML = "";
                let loader = document.createElement("div");
                loader.className = "loader";
                stockListLoading.appendChild(loader);

                fetch(stonk)
                    .then((resp) => {
                        if (resp.ok) {
                            return resp.json();
                        }
                    })
                    .then(data => {
                        if (data != undefined) {
                            stockData(data);
                        }
                    })
                displayCompanyInfo(companyObj);
            })
        }
    }

    function cLister(companies) {
        let companiesTable = document.querySelector("#companiesTable");
        companiesTable.innerHTML = ""; //clear table's existing content
        for (let c of companies) {
            let cLink = '<link>' + c.name + '</link>';
            //start making the table rows
            let row = "<tr>\n<td>" + cLink + "</td>\n</tr>"
            companiesTable.innerHTML += row;
        }
    }

    function companyFilter(filter, companies) {
        filter = filter.toUpperCase();
        let filteredCompanies = [];
        for (c of companies) {
            let name = c.name.toUpperCase();
            if (name.includes(filter)) {
                filteredCompanies.push(c);
            }
        }
        cLister(filteredCompanies);
        cListener(companies);
    }

    function displayCompanyInfo(company) {
        let companyInfoDiv = document.querySelector(".a");
        let chartCompanyInfo = document.querySelector(".j");
        let chartCompanyFinancials = document.querySelector(".i");
        companyInfoDiv.innerHTML = ""; //clear existing content
        chartCompanyInfo.innerHTML = "";
        chartCompanyFinancials.innerHTML = "";
        //Insert Logo
        let img = document.createElement("img");
        img.src = "logos/" + company.symbol + ".svg";
        companyInfoDiv.appendChild(img);
        //Insert symbol
        let symbol = document.createElement("p");
        symbol.innerHTML = company.symbol;
        companyInfoDiv.appendChild(symbol);
        //Insert Name
        let title = document.createElement("h3");
        title.innerHTML = company.name;
        companyInfoDiv.appendChild(title);
        //Insert sector
        let sector = document.createElement("p");
        sector.innerHTML = "Sector: " + company.sector;
        companyInfoDiv.appendChild(sector);
        //Insert subindustry
        let subindustry = document.createElement("p");
        subindustry.innerHTML = "Subindustry: " + company.subindustry;
        companyInfoDiv.appendChild(subindustry);
        //Insert address
        let address = document.createElement("p");
        address.innerHTML = "Address: " + company.address;
        companyInfoDiv.appendChild(address);
        //Insert website
        let website = document.createElement("p");
        website.innerHTML = "Website: " + company.website;
        companyInfoDiv.appendChild(website);
        //Insert exchange
        let exchange = document.createElement("p");
        exchange.innerHTML = "Exchange: " + company.exchange;
        companyInfoDiv.appendChild(exchange);

        //Might as well populate chart view here too
        //Insert Company Name
        let cTitle = document.createElement("h3");
        cTitle.innerHTML = company.name;
        chartCompanyInfo.appendChild(cTitle);
        //Insert Symbol
        let cSymbol = document.createElement("p");
        cSymbol.innerHTML = company.symbol;
        chartCompanyInfo.appendChild(cSymbol);
        //Insert description
        let description = document.createElement("p");
        description.innerHTML = company.description;
        chartCompanyInfo.appendChild(description);
        //Insert Speak Button
        let chartSpeakButton = document.createElement("button");
        chartSpeakButton.id = "speak";
        chartSpeakButton.innerText = "Speak";
        chartCompanyInfo.appendChild(chartSpeakButton);
        document.querySelector("#speak").addEventListener("click", () => {
            var msg = new SpeechSynthesisUtterance(company.description);
            var voices = window.speechSynthesis.getVoices();
            msg.voice = voices[0];
            window.speechSynthesis.speak(msg);
            //this function brought to you by https://devhints.io/js-speech
        })

        //reInsert Close Button
        let chartCloseButton = document.createElement("button");
        chartCloseButton.id = "close";
        chartCloseButton.innerText = "Close";
        chartCompanyInfo.appendChild(chartCloseButton);
        buttonSelectinator("#close");

        //Insert Company Financials
        if (company.financials != null) {
            //Insert header
            let financialheader = document.createElement("h3");
            financialheader.innerHTML = "Financials";
            chartCompanyFinancials.appendChild(financialheader);
            //Insert financials table
            let financialTable = document.createElement("table");
            financialTable.id = "financialsTable";
            //Loop for top row
            let tr1 = document.createElement("tr");
            let th = document.createElement("th");
            tr1.appendChild(th); //empty cell at start of first row
            for (let i = company.financials.years.length - 1; i >= 0; i--) {
                let th1 = document.createElement("th");
                th1.innerHTML = company.financials.years[i];
                tr1.appendChild(th1);
            }
            financialTable.appendChild(tr1); //append first row to table
            //Loop for the other 4 rows
            let titleArray = ["Revenue", "Earnings", "Assets", "Liabilities"];
            let finArray = [company.financials.revenue, company.financials.earnings,
                company.financials.assets, company.financials.liabilities
            ];
            for (let i = 0; i < titleArray.length; i++) {
                let trc = document.createElement("tr");
                let thc = document.createElement("th");
                thc.innerHTML = titleArray[i];
                trc.appendChild(thc); //title of second row
                financialRow(finArray[i]);
                //I know calling a function once isn't the best way to do this, 
                //but I was having problems with every other way I tried
                function financialRow(financialArray) {
                    for (let x = financialArray.length - 1; x >= 0; x--) {
                        let tdc = document.createElement("td");
                        let finNum = "$" + thousands_separators(financialArray[x])
                        tdc.innerHTML = finNum;
                        trc.appendChild(tdc);
                    }
                }
                financialTable.appendChild(trc); //append  row to table
            }
            chartCompanyFinancials.appendChild(financialTable); //append table to div once complete
        } else {
            let financialheader = document.createElement("h3");
            financialheader.innerHTML = "Financials";
            chartCompanyFinancials.appendChild(financialheader);
            let noFinancials = document.createElement("p");
            noFinancials.innerHTML = "Unfortunately there is no financial data for " + company.name;
            chartCompanyFinancials.appendChild(noFinancials);
        }
    };

    function buttonSelectinator(id) {
        document.querySelector(id).addEventListener("click", () => {
            hideDatBoi(homes);
            hideDatBoi(chartViews);
        })
    }
    //hi :)
});