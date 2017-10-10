"use strict";
const querystring = require("querystring");
const Lokka = require("lokka").Lokka;
const Transport = require("lokka-transport-http").Transport;

const graphCoolToken = process.env.GRAPHCOOL_TOKEN;
const headers = {
  Authorization: `Bearer ${graphCoolToken}`
};

const client = new Lokka({
  transport: new Transport("https://api.graph.cool/simple/v1/formette", {
    headers
  })
});

//Gets the user ID
const getUserId = userName => {
  // return "cj5frzfv11z6y0180k67lraep";
  const data = [];
  const query = `
  query getUser($userName: String!) {
    User(userName: $userName){
      id
    }
  }
`;

  const vars = { userName };
  client.query(query, vars).then(result => {
    data.push({
      result
    });
  });

  return data;
};

//gets the form ID to later save the new data
const getFormId = (userId, endpoint) => {
  //return 'cj5frzfv11z6y0180k67lraep/simpi';
  //return `${userId}/${endpoint}`;
  //return "cj8lwcpl0ihit0110vpgz92yc";

  const setEndpoint = `${userId}/${endpoint}`;
  const data = [];

  const query = `
  query getForm($setEndpoint: String!) {
    Forms(endpoint: $setEndpoint) {
      id
      isDisabled
    }
  }
`;

  const vars = { setEndpoint };
  client.query(query, vars).then(result => {
    data.push({
      result
    });
  });

  return data;
};

module.exports.api = (event, context, callback) => {
  //const data = event;
  let data = Object.assign({}, querystring.parse(event.body));
  const getEndpoint = event.pathParameters.id;
  const getUsername = event.pathParameters.username;

  const user = getUserId(getUsername);
  const form = getFormId(user.id, getEndpoint);

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      user,
      form,
      data,
      getEndpoint,
      getUsername
    })
  };

  callback(null, response);


  //checks and validates the parameters and the data
  /*if (!user.id || !form.id || !Object.keys(data).length) {
    console.error("Validation Failed");
    callback(null, {
      statusCode: 400,
      headers: { "Content-Type": "text/plain" },
      body: "Could not execute, missing fields..."
    });
    return;
  }
  //checks if the form accepts data
  if (form.isDisabled) {
    console.error("Validation Failed");
    callback(null, {
      statusCode: 400,
      headers: { "Content-Type": "text/plain" },
      body: "This form does not currently accept data."
    });
    return;
  } else {
    const saveFormDataMutation = `($formId: ID!, $data: [Json!]) {
        updateForms(id: $formId, data: $data) {
          id
        }
      }`;

    const vars = {
      formId: form.id,
      data: [data]
    };

    //saves the data in the DB
    client
      .mutate(saveFormDataMutation, vars)
      .then(resp => {
        //console.log(resp.newFilm);
        const response = {
          statusCode: 200,
          body: JSON.stringify({
            userId,
            formId,
            data
          })
        };

        callback(null, response);
      })
      .catch(e => {
        //sends a error if the data was not saved in the DB
        callback(null, {
          statusCode: 400,
          headers: { "Content-Type": "text/plain" },
          body: e
        });
      });
  }*/
};
