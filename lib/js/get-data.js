//adapted from the cerner smart on fhir guide. updated to utalize client.js v2 library and FHIR R4

// helper function to process fhir resource to get the patient name.
function getPatientName(pt) {
    if (pt.name) {
        var names = pt.name.map(function(name) {
            return name.given.join(" ") + " " + name.family;
        });
        return names.join(" / ")
    } else {
        return "anonymous";
    }
}

// display the patient name gender and dob in the index page
function displayPatient(pt) {
    document.getElementById('patient_name').innerHTML = getPatientName(pt);
    document.getElementById('gender').innerHTML = pt.gender;
    document.getElementById('dob').innerHTML = pt.birthDate;
}

//function to display list of medications
function displayMedication(meds) {
    med_list.innerHTML += "<li> " + meds + "</li>";
}

//Edson I have to privide the info that goes here and I've to pull it too


//helper function to get quanity and unit from an observation resoruce.
function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
        return Number(parseFloat((ob.valueQuantity.value)).toFixed(2)) + ' ' + ob.valueQuantity.unit;
    } else {
        return undefined;
    }
}

// helper function to get both systolic and diastolic bp
function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation) {
        var BP = observation.component.find(function(component) {
            return component.code.coding.find(function(coding) {
                return coding.code == typeOfPressure;
            });
        });
        if (BP) {
            observation.valueQuantity = BP.valueQuantity;
            formattedBPObservations.push(observation);
        }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
}

// create a patient object to initalize the patient
//Edson I've to update thid to initialize inital values
function defaultPatient() {
    return {
        height: {
            value: ''
        },
        weight: {
            value: ''
        },
        weightMeasured: {
            value: ''
        },
        sys: {
            value: ''
        },
        dia: {
            value: ''
        },
        ldl: {
            value: ''
        },
        hdl: {
            value: ''
        },
        note: 'No Annotation',
    };

}

//helper function to display the annotation on the index page
function displayAnnotation(annotation) {
    note.innerHTML = annotation;
}

//function to display the observation values you will need to update this
function displayObservation(obs) {
    hdl.innerHTML = obs.hdl;
    ldl.innerHTML = obs.ldl;
    sys.innerHTML = obs.sys;
    dia.innerHTML = obs.dia;
    height.innerHTML = obs.height;
    weight.innerHTML = obs.weight;
    weightMeasured.innerHTML = obs.weightMeasured;
    weightStated.innerHTML = obs.weightStated;
    weightReported.innerHTML = obs.weightReported;
    weightCalc.innerHTML = obs.weightCalc;

}

//once fhir client is authorized then the following functions can be executed
FHIR.oauth2.ready().then(function(client) {
    // get patient object and then display its demographics info in the banner
    client.request(`Patient/${client.patient.id}`).then(
        function(patient) {
            displayPatient(patient);
            //Get patient FHIR ID
            var patient_FHIR_ID = patient.id;
            //Get patient ID in DB
            firebase.database().ref('Patients/patient').on('value', function (snapshot){
                var patient_DB_ID = snapshot.val().id;
                console.log("patient_DB_ID = ", patient_DB_ID);
                console.log("patient_FHIR_ID = ", patient_FHIR_ID);
                if(patient_FHIR_ID == patient_DB_ID){
                    alert("Welcome Back!");
                }else{
                    //If patient ID is not patient, Prompt for permission
                    window.alert("In the next question, press OK for YES and CANCEL for NO!");
                    var question = confirm("Would you like to securely share your Medical History with your designated caregiver?");
                    if (question == true) {
                        alert("Thank you for sharing your information, Only you and your designated caregiver will have access to your medical records!");
                        //Create database reference
                        var databaseRef = firebase.database().ref('Patients');
                        var patientData = databaseRef.push();
                        patientData.set({
                           'patient':patient,
                        });
                    } else {
                        alert("Thank you, your information will not be shared");
                    }
                }
            });
        }
    );

    //Need to find out what the code is so I can retrieve the information
    var query = new URLSearchParams();

    query.set("patient", client.patient.id);
    query.set("_count", 100);
    query.set("_sort", "-date");
    query.set("code", [
        'http://loinc.org|8462-4',
        'http://loinc.org|8480-6',
        'http://loinc.org|2085-9',
        'http://loinc.org|2089-1',
        'http://loinc.org|55284-4',
        'http://loinc.org|3141-9',
        'http://loinc.org|8302-2',
        'http://loinc.org|29463-7',
        'http://loinc.org|3141-9',
        'http://loinc.org|3142-7',
        'http://loinc.org|75292-3',
        'http://loinc.org|79348-9',
    ].join(","));

    client.request("Observation?" + query, {
        pageLimit: 0,
        flat: true
    }).then(
        function(ob) {

            // group all of the observation resoruces by type into their own
            //May need to do sth with height & weight data here
            var byCodes = client.byCodes(ob, 'code');
            var systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6');
            var diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4');
            var hdl = byCodes('2085-9');
            var ldl = byCodes('2089-1');
            var height = byCodes('8302-2');
            var weight = byCodes('29463-7');
            var weightMeasured = byCodes('3141-9');
            var weightStated = byCodes('3142-7');
            var weightReported = byCodes('75292-3');
            var weightCalc = byCodes('79348-9');

            // create patient object
            var p = defaultPatient();

            // set patient value parameters to the data pulled from the observation resoruce
            if (typeof systolicbp != 'undefined') {
                p.sys = systolicbp;
            } else {
                p.sys = 'undefined'
            }
            if (typeof diastolicbp != 'undefined') {
                p.dia = diastolicbp;
            } else {
                p.dia = 'undefined'
            }

            if (typeof height != 'undefined') {
                p.height = height;
            } else {
                p.height = 'undefined'
            }
            if (typeof weight != 'undefined') {
                p.weight = weight;
            } else {
                p.weight = 'undefined'
            }
            if (typeof weightMeasured != 'undefined') {
                p.weightMeasured = weightMeasured;
            } else {
                p.weightMeasured = 'undefined'
            }
            if (typeof weightStated != 'undefined') {
                p.weightStated = weightStated;
            } else {
                p.weightStated = 'undefined'
            }
            if (typeof weightReported != 'undefined') {
                p.weightReported = weightReported;
            } else {
                p.weightReported = 'undefined'
            }
            if (typeof weightCalc != 'undefined') {
                p.weightCalc = weightCalc;
            } else {
                p.weightCalc = 'undefined'
            }

            p.hdl = getQuantityValueAndUnit(hdl[0]);
            p.ldl = getQuantityValueAndUnit(ldl[0]);
            p.height = getQuantityValueAndUnit(height[0]);
            p.weight = getQuantityValueAndUnit(weight[0]);
            p.weightMeasured = getQuantityValueAndUnit(weightMeasured[0]);
            p.weightStated = getQuantityValueAndUnit(weightStated[0]);
            p.weightReported = getQuantityValueAndUnit(weightReported[0]);
            p.weightCalc = getQuantityValueAndUnit(weightCalc[0]);

            displayObservation(p)

        });
    // dummy data for medrequests
    var medResults = ["Edson Lasix 40mg","Edson Naproxen sodium 220 MG Oral Tablet","Edson_ Amoxicillin 250 MG"]

    // get medication request resources this will need to be updated
    // the goal is to pull all the medication requests and display it in the app. It can be both active and stopped medications
    var medQuery = new URLSearchParams();
    medQuery.set("patient", client.patient.id);
    client.request("MedicationRequest?" + medQuery, {
        resolveReferences: ["medicationReference"],
        pageLimit: 0,
        flat: true
    }).then(
        function(medList) {
            //console.log(medList)
            medList.forEach(function(medication){
                    //console.log(medication)
                    //console.log(medication.medicationCodeableConcept.text)
                    displayMedication(medication.medicationCodeableConcept.text);
                }
            )
        }
    );
    //update function to take in text input from the app and add the note for the latest weight observation annotation
    //you should include text and the author can be set to anything of your choice. keep in mind that this data will
    // be posted to a public sandbox
    function addWeightAnnotation() {
        var author  = document.getElementById("author").value;
        var annotation = document.getElementById("annotation").value;
        var today = new Date();
        var time = today.getUTCFullYear() + ' : ' + today.getMonth() + ' : ' + today.getUTCDate() + ',' + ' : ' + today.getHours() + " : " + today.getMinutes() + " : " + today.getSeconds();
        var hospital = document.getElementById("hospital").value;
        var unit = document.getElementById("unit").value;
        var contact = document.getElementById("contact").value;

        var final = 'Doctor ' + author + ' From ' + hospital + ' ' + unit + ' unit' + ' ' + 'noted that: ' + annotation + ' on ' + time + ' For more questions reach out to Doctor ' + author + ' at: ' + contact;
        //Add Note to database
        var databaseRef = firebase.database().ref('Patients/patient/text');
        var patientData = databaseRef.push();
        patientData.set({
            'Doctor': author,
            'Hospital': hospital,
            'Unit': unit,
            'Note': annotation,
            'Date': time,
            'Contact_Info': contact,
            'Summary':final,
        });

        displayAnnotation(final);
        //Copy info to DB

    }







    //event listner when the add button is clicked to call the function that will add the note to the weight observation
    document.getElementById('add').addEventListener('click', addWeightAnnotation);
    //document.getElementById('export').addEventListener('click', ExportToFirebase);


}).catch(console.error);