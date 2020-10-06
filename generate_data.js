const {performance} = require('perf_hooks');
const fs = require('fs');

let vooIndex = 0;

//Classe do Voo, utilizado para instanciar objetos com as informações disponibilizadas pelas tabelas da ANAC
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

//Função simples para pegar o objeto e salvar na pasta data/generated em formato json
function writeObject(obj, name) {
    fs.writeFileSync('data/generated/'+name, JSON.stringify(obj), function (err) {
        if (err) return console.log(err);
    });
}

//Função que pega o formato de data utilizado pela ANAC e converte para ISO 8601
function parseWeirdDateFormat(dateString) {
    if(!dateString.replace(/\s/g, '').length) { //Se a linha de data estiver vazia retorna 0
        return 0
    }
    try{ //Vai tentar manipular a string para converter o formato
        let firstArray = dateString.split("/")
        let secondArray = firstArray[2].split(" ")
        let day = firstArray[0]
        let month = firstArray[1]
        let year = secondArray[0]

        let hour = secondArray[1]
        if(hour.length != 5) hour = "0"+hour

        return Date.parse(year+'-'+month+'-'+day+'T'+hour+"Z")
    }
    catch(e) { //Caso tenha acontecido algum erro durante a manipulação da string, reporta o erro e retorna NaN
        console.error(e)
        return NaN
    }
}

//Função mais importante do projeto, ela pega a linha do arquivo csv e retorna um objeto Voo
function parseCsvLine(csvLine, lineNumber) {
    let flightData = csvLine.replace(/"/g, '').split(";") //Remove as aspas e separa cada celula da linha csv em um array

    /*
    Testa o primeiro elemento do array para verificar se é a linha descritiva (primeira linha do csv)
    Poderia ser substituido por uma checagem simples do lineNumber mas como eu não confio nas tabelas da ANAC preferi fazer desse jeito
    */
    flightData[0] = flightData[0].replace(/\s/g,'')
    if(flightData[0].startsWith("Publica") || flightData[0].startsWith("ICAO") || flightData[0].startsWith("sg_empresa_icao") || flightData[0].startsWith("Sigla")) {
        return NaN
    }

    /*
    Testa o primeiro elemento do array utilizando regex para verificar se contem um código de empresa aérea válido
    Caso o código não seja valido, manda um erro que interrompe a leitura da tabela.
    */
    let icaoEmpresa = flightData[0].match(/[A-Z]{3}/g)
    if(icaoEmpresa == null || icaoEmpresa.join("") != flightData[0]) {
        console.error(flightData[0])
        throw "Erro ao tentar ler ICAO da Empresa Aérea \""+flightData[0]+"\" na linha "+lineNumber+"! \""+csvLine+"\"";
    }

    //Testa o segundo elemento do array para verificar se o numero de voo é válido
    let numeroVoo = flightData[1]
    if(isNaN(numeroVoo) && !(numeroVoo.startsWith("Z") && !isNaN(numeroVoo.substring(1)))) {
        throw "Erro ao tentar ler número de voo \""+flightData[1]+"\" na linha "+lineNumber+"! \""+csvLine+"\"";
    }

    //Testa o terceiro elemento do array para verificar se o digito identificador é válido
    let digitoIdentificador = flightData[2].match(/^[0123456789DABE]/g)
    if(!flightData[2].replace(/\s/g, '').length) {
        flightData[2] = ""
    }else if(digitoIdentificador == null || digitoIdentificador.join("") != flightData[2]) {
        throw "Erro ao tentar ler dígito identificador \""+flightData[2]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }

    //Testa o quarto elemento do array para verificar se o tipo de linha é válido
    let tipoDeLinha = flightData[3].match(/^[NCIGLREHX]/g)
    if(!flightData[3].replace(/\s/g, '').length) {
        flightData[3] = ""
    }else if(tipoDeLinha == null || tipoDeLinha.join("") != flightData[3] ) {
        throw "Erro ao tentar ler tipo de linha \""+flightData[3]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }

    //Testa o décimo primeiro elemento do array para verificar se o voo foi realizado ou cancelado
    let situacaoVoo = flightData[10].toUpperCase().replace("Ã", "A").replace("NAO REALIZADO", "CANCELADO")
    if(situacaoVoo != "REALIZADO" && situacaoVoo != "CANCELADO" && situacaoVoo != "NAO INFORMADO") {
        throw "Erro ao tentar ler Situação de Vôo \""+flightData[10]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }
    let cancelado = (situacaoVoo == "CANCELADO")

    /*
    Testa o décimo segundo elemento do array para verificar se um código de justificativa foi informado e se o mesmo é válido
    Caso não haja justificativa, coloca uma string vazia
    */
    let codigoJustificativa = ""
    if(flightData.size >= 12) {
        let codigoJustificativa = flightData[11].match(/[A-Z]{2}/g)
        if(codigoJustificativa != null && codigoJustificativa.join("") == flightData[11]) {
            codigoJustificativa = flightData[11]
        }else{
            codigoJustificativa = ""
        }
    }

    //Testa o quinto elemento do array para verificar se o código do aeroporto de partida é valido
    let icaoOrigem = flightData[4].match(/[A-Z]{4}/g)
    if(icaoOrigem == null || icaoOrigem.join("") != flightData[4]) {
        throw "Erro ao tentar ler ICAO Origem \""+flightData[4]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }

    /*
    Testa o sexto elemento do array para verificar se o código do aeroporto de destino é válido
    Caso o aeroporto de destino não seja informado retorna um objeto Voo incompleto (voos confidenciais)
    */
    let icaoDestino = flightData[5].match(/[A-Z]{4}/g)
    if(!flightData[5].replace(/\s/g, '').length) {
        return new Voo(flightData[0], flightData[1], flightData[2], flightData[3], flightData[4], flightData[5], 0, 0, 0, 0, situacaoVoo, codigoJustificativa)
    }else if(icaoDestino == null || icaoDestino.join("") != flightData[5]) {
        throw "Erro ao tentar ler ICAO Destino \""+flightData[5]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }

    /*
    Testa o sétimo elemento do array para verificar se a partida prevista é válida
    Como as tabelas da ANAC são uma bagunça, vários voos não tem partida/chegada informada, logo ele irá salvar a data inicial do unix 
    */
    let partidaPrevista = parseWeirdDateFormat(flightData[6])
    if(!cancelado && isNaN(partidaPrevista)) {
        throw "Erro ao tentar ler Partida Prevista \""+flightData[6]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }

    //Testa o oitavo elemento do array para verificar se a partida real é válida
    let partidaReal = parseWeirdDateFormat(flightData[7].replace("NAO INFORMADO", ""))
    if(!cancelado && isNaN(partidaReal)) {
        throw "Erro ao tentar ler Partida Real \""+flightData[7]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }

    //Testa o nono elemento do array para verificar se a chegada prevista é válida
    let chegadaPrevista = parseWeirdDateFormat(flightData[8])
    if(!cancelado && isNaN(chegadaPrevista)) {
        throw "Erro ao tentar ler Chegada Prevista \""+flightData[8]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }

    //Testa o décimo elemento do array para verificar se a chegada real é válida
    let chegadaReal = parseWeirdDateFormat(flightData[9].replace("NAO INFORMADO", ""))
    if(!cancelado && isNaN(chegadaReal)) {
        throw "Erro ao tentar ler Chegada Real \""+flightData[9]+"\" na linha "+lineNumber+"! \""+csvLine+"\""
    }

    //Retorna o objeto do voo com os dados já separados e organizados
    return new Voo(flightData[0], flightData[1], flightData[2], flightData[3], flightData[4], flightData[5], partidaPrevista, partidaReal, chegadaPrevista, chegadaReal, situacaoVoo, codigoJustificativa)
}

//Objetos para separar as informações dos voos
let voosCanceladosPorEmpresa = {}
let voosAtrasadosPorEmpresa = {}
let voosPorDia = {}
let voosPorEmpresa = {}

//Função que recebe o objeto voo e separa suas informações nos modelos definidos pelo grupo
function handleVoo(voo) {

    let unix = voo.partidaPrevista
    if(isNaN(unix) || unix == 0) {
        unix = voo.partidaReal
        if(isNaN(unix)) {
            unix = 0
        }
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

//Função que recebe o nome da tabela e lê a mesma
function lerTabela(tabela) {
    let data = fs.readFileSync("data/flight_tables/"+tabela);
    let time0 = performance.now()
    let csvLineArray = data.toString().match(/[^\r\n]+/g);
    try {
        csvLineArray.forEach(function(value, index) {
            try {
                let voo = parseCsvLine(value, index)
                handleVoo(voo)
            }
            catch(e) {
                console.error(e)
                throw "A leitura da tabela "+tabela+" foi interrompida!"
            }
        })
        let time1 = performance.now()
        console.log("A leitura da tabela "+tabela+" foi concluida em "+(time1 - time0)+" milissegundos!")
    }catch(e) {
        console.error(e)
    }
}

/*Inicio do código executavel*/

//Pega todas os arquivos salvos na pasta data/flight_tables e le eles como uma tabela csv
let files = fs.readdirSync("data/flight_tables")
files.forEach(function (file) {
    lerTabela(file)
});

//Da sort nos voos por dia para deixar em ordem cronologica
let voosPorDiaKeys = Object.keys(voosPorDia)
voosPorDiaKeys.sort()
let voosPorDiaSorted = {}
for(k in voosPorDiaKeys) {
    let key = voosPorDiaKeys[k]
    voosPorDiaSorted[key] = voosPorDia[key]
}

//Salva as informações de voos separados em arquivos .json
writeObject(voosPorDiaSorted, "voosPorDia.json")
writeObject(voosPorEmpresa, "voosPorEmpresa.json")
writeObject(voosAtrasadosPorEmpresa, "voosAtrasadosPorEmpresa.json")
writeObject(voosCanceladosPorEmpresa, "voosCanceladosPorEmpresa.json")
