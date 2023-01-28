const axios = require('axios');
const ManufacturingSectors = require('./data/manufacturingSectors.json');
const fs = require('fs');


const http = axios.create({
    baseURL: "https://attack.mitre.org/versions/v12/groups"
});

// Run on start and then every 24 hours after that.
generateLayerFiles()
setInterval(function() {
    generateLayerFiles()
  }, 86400000); // 86400000 milliseconds = 24 hours



/* 
    This function will loop through all the manufacturingSectors.json file and generate a layer.json file for each sector object.
    Files are stored under /src/data/layers
    Pre-built layers by group can be obtained from the following endpoint.
    https://attack.mitre.org/versions/v12/groups/G0096/G0096-enterprise-layer.json
*/
function generateLayerFiles() {
    try {
        /* 
            We enter the ManufacturingSectors object and retrieve each corresponding groups layer.json file, gather all the groups techniques and save a new layer.json file including all techniques used by each group.
        */
        for (let i = 0; i < ManufacturingSectors.length; i++) {
            let sectorDiscription = ManufacturingSectors[i].description
            let sector = ManufacturingSectors[i];
            let activeGroups = sector.mitre_activity_groups;
            let fileName = (sector.name).replaceAll(' ', '_')
            let lastFileSaved = '';
            
            setTimeout(getLayers, 30000);

            function getLayers() {
            getGroupLayerFiles(activeGroups).then(response => {
                let layerFile = {
                    "description": sectorDiscription,
                    "name": sector.name,
                    "domain": "enterprise-attack",
                    "versions": {
                        "layer": "4.4",
                        "attack": "12",
                        "navigator": "4.5"
                        },
                    "layout": {
                        "layout": "flat",
                        "showName": true,
                        "showID": false
                        },
                    "techniques": response,
                    "gradient": {
                    "colors": [
                        "#ffffff",
                        "#66b1ff"
                    ],
                    "minValue": 0,
                    "maxValue": 1
                    }
                }

                // We check to make sure we have the needed data before saving.
                if (layerFile.techniques.length > 0) {
                    let file = JSON.stringify(layerFile, undefined, 4)
                    saveFile(fileName, file, lastFileSaved)
                    lastFileSaved = fileName;
                }

                
            });
        }
        }
    } catch(error) {
        console.log((new Date()).toISOString() + `[ERROR] Generating layer.json files. ${error}.`);
    }
}



async function getGroupLayerFiles(groups) {
    try {
        let techniquesArray = [];
        await Promise.all(groups.map(async group => {
            let response = await http.get(`https://attack.mitre.org/versions/v12/groups/${group}/${group}-enterprise-layer.json`)
            .then(response => {
                let responseData = response.data;
                techniquesArray.push(responseData.techniques);
            })
            .catch(err => {
                console.error(err);
            });
        }));
        return techniquesArray;
    } catch (err) {
        console.error(err);
    }
}


function saveFile(name, data, lastFileSaved) {
    if (name !== lastFileSaved) {
        console.log(name)
        console.log(lastFileSaved)
        lastFileSaved = name;
        fs.writeFile(`./data/layers/${name}.json`, data, (err) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log("File saved successfully!");
        });
    }
}