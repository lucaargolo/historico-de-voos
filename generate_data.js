const {performance} = require('perf_hooks');
const fs = require('fs');

function writeObject(obj, name) {
    fs.writeFileSync('data/generated/'+name, JSON.stringify(obj), function (err) {
        if (err) return console.log(err);
    });
}

let vooIndex = 0;

class Voo {
    constructor(icaoEmpresa, numeroVoo, digitoIdentificador, tipoDeLinha, icaoOrigem, icaoDestino, partidaPrevista, partidaReal, chegadaPrevista, chegadaReal, situacaoVoo, codigoJustificativa) {
        this.icaoEmpresa = icaoEmpresa;
        this.numeroVoo = numeroVoo;
        this.digitoIdentificador = digitoIdentificador;
        this.tipoDeLinha = tipoDeLinha;
        this.icaoOrigem = icaoOrigem;
        this.icaoDestino = icaoDestino;
        this.partidaPrevista = partidaPrevista;
        this.partidaReal = partidaReal;
        this.chegadaPrevista = chegadaPrevista;
        this.chegadaReal = chegadaReal;
        this.situacaoVoo = situacaoVoo;
        this.codigoJustificativa = codigoJustificativa;
        this.index = vooIndex;
        vooIndex++;
    }
}

function parseWeirdDateFormat(dateString) {
    if(!dateString.replace(/\s/g, '').length) {
        return 0
    }
    try{
        let firstArray = dateString.split("/")
        let secondArray = firstArray[2].split(" ")
        let day = firstArray[0]
        let month = firstArray[1]
        let year = secondArray[0]

        let hour = secondArray[1]
        if(hour.length != 5) hour = "0"+hour

        return Date.parse(year+'-'+month+'-'+day+'T'+hour+"Z")
    }
    catch(e) {
        console.error(e)
        return NaN
    }
}

function parseCsvLine(csvLine, lineNumber) {
    let flightData = csvLine.replace(/"/g, '').split(";")

    flightData[0] = flightData[0].replace(/\s/g,'')
    if(flightData[0].startsWith("Publica") || flightData[0].startsWith("ICAO") || flightData[0].startsWith("sg_empresa_icao") || flightData[0].startsWith("Sigla")) {
        return NaN
    }

    let icaoEmpresa = flightData[0].match(/[A-Z]{3}/g)
    if(icaoEmpresa == null || icaoEmpresa.join("") != flightData[0]) {
        console.error(flightData[0])
        throw "Erro ao tentar ler ICAO da Empresa Aérea \""+flightData[0]+"\" na linha "+lineNumber+"! \""+csvLine+"\"";
    }

    let numeroVoo = flightData[1]
    if(isNaN(numeroVoo) && !(numeroVoo.startsWith("Z") && !isNaN(numeroVoo.substring(1)))) {
        throw "Erro ao tentar ler número de voo \""+flightData[1]+"\" na linha "+lineNumber+"! \""+csvLine+"\"";
    }

    let digitoIdentificador = flightData[2].match(/^[0123456789DABE]/g)
    if(!flightData[2].replace(/\s/g, '').length) {
        flightData[2] = ""
    }else if(digitoIdentificador == null || digitoIdentificador.join("") != flightData[2]) {
        throw "Erro ao tentar ler dígito identificador \""+flightData[2]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }

    let tipoDeLinha = flightData[3].match(/^[NCIGLREHX]/g)
    if(!flightData[3].replace(/\s/g, '').length) {
        flightData[3] = ""
    }else if(tipoDeLinha == null || tipoDeLinha.join("") != flightData[3] ) {
        throw "Erro ao tentar ler tipo de linha \""+flightData[3]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }

    let situacaoVoo = flightData[10].toUpperCase().replace("Ã", "A").replace("NAO REALIZADO", "CANCELADO")
    if(situacaoVoo != "REALIZADO" && situacaoVoo != "CANCELADO" && situacaoVoo != "NAO INFORMADO") {
        throw "Erro ao tentar ler Situação de Vôo \""+flightData[10]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }
    let cancelado = (situacaoVoo == "CANCELADO")

    let codigoJustificativa = ""
    if(flightData.size >= 12) {
        let codigoJustificativa = flightData[11].match(/[A-Z]{2}/g)
        if(codigoJustificativa != null && codigoJustificativa.join("") == flightData[11]) {
            codigoJustificativa = flightData[11]
        }else{
            codigoJustificativa = ""
        }
    }

    let icaoOrigem = flightData[4].match(/[A-Z]{4}/g)
    if(icaoOrigem == null || icaoOrigem.join("") != flightData[4]) {
        throw "Erro ao tentar ler ICAO Origem \""+flightData[4]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }

    let icaoDestino = flightData[5].match(/[A-Z]{4}/g)
    if(!flightData[5].replace(/\s/g, '').length) {
        return new Voo(flightData[0], flightData[1], flightData[2], flightData[3], flightData[4], flightData[5], 0, 0, 0, 0, situacaoVoo, codigoJustificativa)
    }else if(icaoDestino == null || icaoDestino.join("") != flightData[5]) {
        throw "Erro ao tentar ler ICAO Destino \""+flightData[5]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }

    let partidaPrevista = parseWeirdDateFormat(flightData[6])
    if(!cancelado && isNaN(partidaPrevista)) {
        throw "Erro ao tentar ler Partida Prevista \""+flightData[6]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }

    let partidaReal = parseWeirdDateFormat(flightData[7].replace("NAO INFORMADO", ""))
    if(!cancelado && isNaN(partidaReal)) {
        throw "Erro ao tentar ler Partida Real \""+flightData[7]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }

    let chegadaPrevista = parseWeirdDateFormat(flightData[8])
    if(!cancelado && isNaN(chegadaPrevista)) {
        throw "Erro ao tentar ler Chegada Prevista \""+flightData[8]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }

    let chegadaReal = parseWeirdDateFormat(flightData[9].replace("NAO INFORMADO", ""))
    if(!cancelado && isNaN(chegadaReal)) {
        throw "Erro ao tentar ler Chegada Real \""+flightData[9]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }

    return new Voo(flightData[0], flightData[1], flightData[2], flightData[3], flightData[4], flightData[5], partidaPrevista, partidaReal, chegadaPrevista, chegadaReal, situacaoVoo, codigoJustificativa)
}


let voosCanceladosPorEmpresa = {}
let voosAtrasadosPorEmpresa = {}
let voosPorDia = {}
let voosPorEmpresa = {}

function handleVoo(voo) {

    let unix = voo.partidaPrevista
    if(isNaN(unix)) {
        unix = 0
    }
    let date = new Date(unix)
    let dayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    if(isNaN(voosPorDia[dayDate.getTime()])) {
        voosPorDia[dayDate.getTime()] = 0
    }
    voosPorDia[dayDate.getTime()]++
    
    let empresa = voo.icaoEmpresa
    if(isNaN(voosPorEmpresa[empresa])) {
        voosPorEmpresa[empresa] = 0
    }
    voosPorEmpresa[empresa]++

    if(voo.situacaoVoo == "CANCELADO") {
        if(isNaN(voosCanceladosPorEmpresa[empresa])) {
            voosCanceladosPorEmpresa[empresa] = 0
        }
        voosCanceladosPorEmpresa[empresa]++
    }
    
    if(voo.chegadaReal > voo.chegadaPrevista) {
        if(isNaN(voosAtrasadosPorEmpresa[empresa])) {
            voosAtrasadosPorEmpresa[empresa] = 0
        }
        voosAtrasadosPorEmpresa[empresa]++
    }
}

function lerTabela(tabela) {
    let data = fs.readFileSync("data/flight_tables/"+tabela+".csv");
    let time0 = performance.now()
    let csvLineArray = data.toString().match(/[^\r\n]+/g);
    csvLineArray.forEach(function(value, index) {
        try {
            let voo = parseCsvLine(value, index)
            handleVoo(voo)
        }
        catch(e) {
            console.error(e)
        }
    })
    let time1 = performance.now()
    console.log("A leitura da tabela "+tabela+" foi concluida em "+(time1 - time0)+" milissegundos!")
}

for (let ano = 0; ano <= 5; ano++) {
    for(let mes = 1; mes <= 12; mes++) {
        let month = "0"+mes
        if(mes > 9) month = mes
        if(ano == 5 && mes > 8) break
        lerTabela((2015+ano)+"-"+month)
    }
}

let voosPorDiaKeys = Object.keys(voosPorDia)
voosPorDiaKeys.sort()
let voosPorDiaSorted = {}
for(k in voosPorDiaKeys) {
    let key = voosPorDiaKeys[k]
    voosPorDiaSorted[key] = voosPorDia[key]
}

writeObject(voosPorDiaSorted, "voosPorDia.json")
writeObject(voosPorEmpresa, "voosPorEmpresa.json")
writeObject(voosAtrasadosPorEmpresa, "voosAtrasadosPorEmpresa.json")
writeObject(voosCanceladosPorEmpresa, "voosCanceladosPorEmpresa.json")
