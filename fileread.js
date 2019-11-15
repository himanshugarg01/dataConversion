var path = '../user_data/dd/4002-out.log';
//var path = '../user_data/sample_data.js';
var output_file = '/output.txt';
var fs = require('fs');
var inspect = require('util').inspect;

var buffer = '';
var n=0;
var flag=0;
var str='';
var obj={};
var userId;
var questionId;
var quizId;
var stepwise;
var text;
var input;
var txtSub;
var inputMCQ;
var isStepwise;
var stepwiseUserInput;
var stepInput;
var t;
var innerObj={};
var rs = fs.createReadStream(path);
var mongoose = require('mongoose');
var mongoDB = 'mongodb+srv://himanshu:tbb8TQTt6NhpiETZ@test-pv16m.mongodb.net/test?retryWrites=true&w=majority'; // myDB is database name

mongoose.connect(mongoDB);

mongoose.connection.on('error', (err) => {
    console.log('DB connection Error');
});

mongoose.connection.on('connected', (err) => {
    console.log('DB connected');
});

var UASchema = new mongoose.Schema({
  userId: String,
  quizId: String,
  questionId: String,
  finalSubmission: Boolean,
})
var ua =  mongoose.model('UA', UASchema);
var UATSchema = new mongoose.Schema({
  ua:{
    type : mongoose.Schema.Types.ObjectId,
    ref : 'ua'
    },
  attempts : Array,
})

var UQSSchema = new mongoose.Schema({
  userId : String,
  quizId : String,
  submittedQuestionsData : {},
  
})

var uat =  mongoose.model('UAT', UATSchema);
var uqs =  mongoose.model('UQS', UQSSchema);


rs.on('data', function(chunk) {
  var lines = ("" + chunk).split(/\r?\n/g);
  buffer = lines.pop();
  
  for (var i = 0; i < lines.length; ++i) {
    var x=lines[i].search('Submission {');
    if(x!=-1||lines[i].indexOf('Submission [')!=-1)
    {
      innerObj={};
    flag=1;
    n++;
    }
    if(flag==1)
    {
      str+=lines[i];
      var quiz=lines[i].search('quizId:');
      var ques=lines[i].search('questionId:');
      var user=lines[i].search('userId:');
      stepwise=lines[i].search('isStepwise:');
      text=lines[i].search('txtSub:');
      input=lines[i].search('inputMCQ:');
      stepInput=lines[i].search('stepwiseUserInput:');
      
      if(quiz!=-1)
      {
        quizId=lines[i].substring(quiz+9,lines[i].length-2);
      }
      else if(ques!=-1)
      {
        questionId=lines[i].substring(ques+13,lines[i].length-2);
      }
      else if(user!=-1)
      {
        userId=lines[i].substring(user+9,lines[i].length-2);
      }
      else if(stepwise!=-1)
      {
        isStepwise=lines[i].substring(stepwise+12,lines[i].length-1);
        innerObj['isStepwise']=JSON.parse(isStepwise);
      }
      else if(text!=-1)
      {
        txtSub=lines[i].substring(text+9,lines[i].length-2);
        innerObj['txtSub']=txtSub;
      }
      else if(input!=-1)
      {
        inputMCQ=lines[i].substring(input+11,lines[i].length-2);
        innerObj['inputMCQ']=inputMCQ;
      }
      else if(stepInput!=-1)
      {
        stepwiseUserInput=lines[i].substring(stepInput+19,lines[i].length-1);
        innerObj['stepwiseUserInput']=stepwiseUserInput;
      }
      else{

      }
    }
    t=lines[i].search('time:');
    if(flag==1&&t!=-1)
    {
      flag=0;      
      makeObject(lines[i]);

      str='';

    }

  }

  
});
rs.on('end', function() {
  makeObject(str); 
  console.log(obj);
  // fs.writeFile("../3002_data"+".json", JSON.stringify(obj), function(err) {
  //   if(err) {
  //       return console.log(err);
  //   }

  //   console.log("The file was saved!");
    makeDB();
// });
});

function makeDB()
{

  var quizArr=Object.keys(obj);
  console.log(quizArr);
  
  var i=0;
  for(i=0;i<quizArr.length;i++)
  {

    var userArr=Object.keys(obj[quizArr[i]]);
    
    for(var j=0;j<userArr.length;j++)
    {
      var userObj=obj[quizArr[i]][userArr[j]];
      let newUQS = new uqs({
        userId : userArr[j],
        quizId : quizArr[i],
        submittedQuestionsData : userObj,
        });
        newUQS.save().then(data => {
        console.log(data);
        
      
        })
        .catch(err => {
          console.log(err);
          
        })
      var quesArr=Object.keys(obj[quizArr[i]][userArr[j]]);
      for(var k=0;k<quesArr.length;k++)
      {
        var quesObj=obj[quizArr[i]][userArr[j]][quesArr[k]];
        let newUA = new ua({
          userId: userArr[j],
          quizId: quizArr[i],
          questionId: quesArr[k],
          finalSubmission: true,
  
      });
      newUA.save().then(data => {
        //console.log(data,obj);
        let newUAT = new uat({
          ua : data._id,
          attempts : quesObj
          });
          newUAT.save().then(data => {
          console.log(data);
          
        
          })
          .catch(err => {
            console.log(err);
            
          })   
          })
          .catch(err => {
            console.log(err);
            
          })
      }
    }
    
  }

}
function makeObject(str)
{
  var time=str.substring(t+7,str.length-2);
  //var innerObj={};
  innerObj['time']=parseInt(time);
  console.log(innerObj);
  
  
      if(obj[quizId]==undefined)
      {
      obj[quizId]={[userId]:{[questionId]:[]}};
      obj[quizId][userId][questionId].push(innerObj);
      }
      else{
        if(obj[quizId][userId]==undefined)
        {
          obj[quizId][userId]={[questionId]:[]};
          obj[quizId][userId][questionId].push(innerObj);
        }
        else
        {
          if(obj[quizId][userId][questionId]==undefined)
          {
            obj[quizId][userId][questionId]=[];
          }
          obj[quizId][userId][questionId].push(innerObj);
          
        }
      }
}