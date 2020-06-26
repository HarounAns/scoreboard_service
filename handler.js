'use strict';
const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGO_URI;

// cors headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

module.exports.getScoreBoard = async event => {
  const client = await MongoClient.connect(uri, { useNewUrlParser: true })
    .catch(err => { console.log(err); });

  if (!client) {
    return;
  }

  try {

    const db = client.db("miscellaneous");

    let collection = db.collection('top10');

    let res = await collection.findOne();

    console.log(res);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(
        {
          message: 'Successfully retrieved top 10 leaderboard',
          result: res,
        },
        null,
        2
      ),
    };

  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(
        {
          message: 'Error getting top 10 leaderboard',
          err
        },
        null,
        2
      ),
    };
  } finally {

    client.close();
  }
};

module.exports.addToScoreboard = async event => {
  const body = JSON.parse(event.body);
  const name = body.name;
  const score = body.score;

  if (!name || !score) {
    throw ("Name and Score are required fields");
  }

  const obj = {
    name,
    score
  }

  const client = await MongoClient.connect(uri, { useNewUrlParser: true })
    .catch(err => { console.log(err); });

  if (!client) {
    return;
  }

  try {

    const db = client.db("miscellaneous");
    const collection = db.collection('top10');

    const res = await collection.findOne();
    let top10 = res.top10;

    if (top10.length >= 10) {
      // should be sorted, but sort list by score as a sanity check
      top10.sort((a, b) => (a.score < b.score) ? 1 : -1)

      // if current score is lower than the lowest score, return
      if (top10[top10.length - 1].score >= score) {
        // no need to add the score to the leaderboard
        throw ("Trying to add a score that is to low to be on the leaderboard");
      }

      // else pop top10 list to remove lowest score
      top10.pop();
    }

    top10.push(obj);

    // sort again
    top10.sort((a, b) => (a.score < b.score) ? 1 : -1);

    // only one object in collection
    // using replace one because of this https://stackoverflow.com/questions/38883285/error-the-update-operation-document-must-contain-atomic-operators-when-running
    const updated = await collection.replaceOne({}, { top10 });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(
        {
          message: 'Successfully updated top 10 leaderboard',
          result: updated,
        },
        null,
        2
      ),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(
        {
          message: 'Error updating top 10 leaderboard',
          err
        },
        null,
        2
      ),
    };
  } finally {

    client.close();
  }
};