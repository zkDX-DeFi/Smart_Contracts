function calcZusd() {

    let positionLimit = 4200;
    let maxLeverage = 1.5;
    let zusdInTotal = 0;

    while (positionLimit > 15) {
        console.log("positionLimit: ", positionLimit)
        let zusdIn = positionLimit / maxLeverage;
        zusdInTotal += zusdIn;
        positionLimit = zusdIn;
    }

    console.log("zusdInTotal: ", zusdInTotal); // 7175
}

calcZusd()