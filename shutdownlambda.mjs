import AWSEC2 from "@aws-sdk/client-ec2"; //https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ec2/
import AWSSNS from "@aws-sdk/client-sns"; //https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-sns/index.html


export const handler = async (event) => {
    // Create an EC2 client
    const ec2 = new AWSEC2.EC2({ region: "eu-west-1" });
    //const ec2 = new client.EC2();

    // Get the current time
    const now = new Date();

    // Calculate the launch time threshold (two hours ago)
    const maxstart = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Get a list of all the running instances
    const result = await ec2.describeInstances({
        Filters: [
            {
                Name: 'instance-state-name',
                Values: ['running']
            }
        ]
    });
    
    const topicArn = process.env.topic; 
    console.log(topicArn); 

    // Create an SNS client
    const sns = new AWSSNS.SNS();


    // Extract the instance IDs from the result
    const instances = result.Reservations.flatMap(reservation => reservation.Instances);
     
    for (let instance of instances) {
        console.log("running: " +JSON.stringify(instance));
        console.log("running: " +instance.InstanceId + " " + instance.KeyName);
        if (instance.LaunchTime < maxstart){
            console.log("Start Time: " +instance.LaunchTime);
            console.log("Shutdown: " +instance.InstanceId + " " + instance.KeyName);
            let ids = [instance.InstanceId];
            
            // shutdown
            await ec2.stopInstances({InstanceIds: ids});
            
            // Publish the message to the topic
            await sns.publish({
                TopicArn: topicArn,
                Message: "running EC2 instances: "+ instance.InstanceId + " " + instance.KeyName +" shutdown",
                Subject: "Shutdown EC2 Instances in ProIT A"
            });
        }
    }
    

    return null; 
};
