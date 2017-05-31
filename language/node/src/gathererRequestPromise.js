/*
 * Copyright 2017 Peter Reid <peter@reidweb.com>
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';
let cheerio = require('cheerio');
let rp = require('request-promise');
let Promise = require('bluebird');
let RateLimiter = require('limiter').RateLimiter;
const START_ID = 1;
const END_ID = 100;
const LODESTONE_HOST = 'eu.finalfantasyxiv.com';

let limiter = new RateLimiter(50, 'second');

/**
 * Create an array of IDs beginning at the specified startId and ending at the the specified endId.
 *
 * @param {int} startId - ID to start at
 * @param {int} endId - ID to end at
 * @returns {Promise} the completed array of integers
 */
function convertRangeToArray (startId, endId) {
  var indexes = [];

  return new Promise(function (resolve) {
    for (var index = startId; index <= endId; index++) {
      indexes.push(index.toString());
      if (indexes.length === (endId - startId)) {
        resolve(indexes);
      }
    }
  });
}

/**
 * Fetch a set of characters bounded by a range of IDs (inclusive) from the FFXIV lodestone.
 *
 * @param  {int} startId - ID to start with.
 * @param {int} endId ID - to end with.
 * @returns {Promise} the character objects from the ID range specified
 */
function getCharacterRange (startId, endId) {
  return new Promise(function (resolve) {
    convertRangeToArray(startId, endId).then(function (ids) {
      getCharacterArray(ids).then(function (characters) {
        resolve(characters);
      });
    });
  });
}

function getCharacter (id) {
  var setItems = [];
  var totalILvl = 0;
  var pieceCount = 0;
  var ringCount = 0;
  var errObj;

  var path = "/lodestone/character/" + id;
  return new Promise(function (resolve) {
    //Fetch character page from lodestone
    getPage(path).then(function (body) {
      var character = {};
      var $ = cheerio.load(body);

      character.id = id.toString();
      character.name = $("title").text().split("|")[0].trim();
      resolve(character);
    }).catch(function (e) {
      errObj = {};
      errObj.id = id.toString();
      errObj.error = true;
      errObj.errCode = e;
      errObj.errMessage = "Character with ID " + id + " not found";
      resolve(errObj);
    });
  });
}

function getCharacterArray (ids) {

  var characters = [];
  var fetchedIndexes = [];

  return new Promise(function (resolve) {
    limiter.removeTokens(1, function () {
      ids.forEach(function (index) {

        getCharacter(index).then(function (character) {
          fetchedIndexes.push(index);
          characters.push(character);
          if (fetchedIndexes.length === ids.length) {
            resolve(characters);
          }
        });
      });
    }); //END LIMITER
  });
}

function getPage (path) {
  let url = 'http://' + LODESTONE_HOST + path;

  let options = {
    method: 'GET',
    uri: url,
    resolveWithFullResponse: true
  };
  return new Promise(function (resolve, reject) {
    rp(options)
      .then(function (response) {
        if (response.statusCode === 200) {
          resolve(response.body);
        } else {
          reject(response.statusCode);
        }
      })
      .catch(function (error) {
        reject(error);
      });
  });
}
getCharacterRange(START_ID, END_ID).then((results) => {
  console.log("done");
});