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

module.exports.api = (event, context, callback) => {
  //const data = event;
  let data = Object.assign({}, querystring.parse(event.body));
  const userName = event.pathParameters.username;
  const getEndpoint = event.pathParameters.id;
  //checks and validates the parameters and the data
  if (!userName || !getEndpoint || !Object.keys(data).length) {
    console.error("Validation Failed");
    callback(null, {
      statusCode: 400,
      body: JSON.stringify({
        error: true,
        status: 400,
        message: "Could not execute, missing fields..."
      })
    });
    return;
  }
  //verifies the user and gets the user id
  const getUserQuery = `
  query getUser($userName: String!) {
    User(userName: $userName){
      id
    }
  }
`;
  const getUserQueryVars = { userName };
  client
    .query(getUserQuery, getUserQueryVars)
    .then(res => {
      const userId = res.User.id;
      const setEndpoint = `${userId}/${getEndpoint}`;
      //verifies the form and gets the form id
      const getFormQuery = `
    query getForm($setEndpoint: String!) {
      Forms(endpoint: $setEndpoint) {
        id
        isDisabled
      }
    }
  `;
      const getFormQueryVars = { setEndpoint };
      client
        .query(getFormQuery, getFormQueryVars)
        .then(res => {
          const formId = res.Forms.id;
          const isDisabled = res.Forms.isDisabled;
          //checks if the form is enable to receive data submissions
          if (isDisabled) {
            callback(null, {
              statusCode: 404,
              body: JSON.stringify({
                error: true,
                status: 404,
                message: "At this moment the form is not accepting submissions."
              })
            });
            return;
          }

          //verifies and saves the new data in the form
          const saveFormDataMutation = `($formId: ID!, $data: [Json!]!) {
        createContent(formsId: $formId, data: $data) {
          id
        }
      }`;
          const saveFormDataMutationVars = {
            formId,
            data
          };
          //saves the data in the DB
          client
            .mutate(saveFormDataMutation, saveFormDataMutationVars)
            .then(res => {
              callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                  error: false,
                  status: 200,
                  message: "Successfully submitted form."
                })
              });
            })
            .catch(e => {
              //sends a error if the data was not saved in the DB
              callback(null, {
                statusCode: 400,
                body: JSON.stringify({
                  error: true,
                  status: 400,
                  message: "Something wrong happened the data was not saved."
                })
              });
            });
        })
        .catch(e => {
          callback(null, {
            statusCode: 404,
            body: JSON.stringify({
              error: true,
              status: 404,
              message: "This form does not exist."
            })
          });
        });
    })
    .catch(e => {
      callback(null, {
        statusCode: 404,
        body: JSON.stringify({
          error: true,
          status: 404,
          message: "This user does not exist."
        })
      });
    });
};
