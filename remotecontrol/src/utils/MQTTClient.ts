import { mqtt, auth, iot } from "aws-iot-device-sdk-v2";
import AWS from "aws-sdk";

/**
 * AWSCognitoCredentialOptions. The credentials options used to create AWSCongnitoCredentialProvider.
 */
interface AWSCognitoCredentialOptions {
  IdentityPoolId: string;
  Region: string;
}

function log(text: string) {
  console.log(text);
}

const clientId = "CandyDispenserBrowser_" + Math.floor(Math.random() * 10000);

/**
 * AWSCognitoCredentialsProvider. The AWSCognitoCredentialsProvider implements AWS.CognitoIdentityCredentials.
 *
 */
class AWSCognitoCredentialsProvider extends auth.CredentialsProvider {
  private options: AWSCognitoCredentialOptions;
  private source_provider: AWS.CognitoIdentityCredentials;
  private aws_credentials: auth.AWSCredentials;
  constructor(
    options: AWSCognitoCredentialOptions,
    expire_interval_in_ms?: number
  ) {
    super();
    this.options = options;
    AWS.config.region = options.Region;
    this.source_provider = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: options.IdentityPoolId,
    });
    this.aws_credentials = {
      aws_region: options.Region,
      aws_access_id: this.source_provider.accessKeyId,
      aws_secret_key: this.source_provider.secretAccessKey,
      aws_sts_token: this.source_provider.sessionToken,
    };

    setInterval(async () => {
      await this.refreshCredentialAsync();
    }, expire_interval_in_ms ?? 3600 * 1000);
  }

  getCredentials() {
    return this.aws_credentials;
  }

  async refreshCredentialAsync() {
    return new Promise<AWSCognitoCredentialsProvider>((resolve, reject) => {
      this.source_provider.get((err) => {
        if (err) {
          log("Failed to get cognito credentials. " + err);
          console.log(err);

          reject("Failed to get cognito credentials. " + err);
        } else {
          this.aws_credentials.aws_access_id = this.source_provider.accessKeyId;
          this.aws_credentials.aws_secret_key =
            this.source_provider.secretAccessKey;
          this.aws_credentials.aws_sts_token =
            this.source_provider.sessionToken;
          this.aws_credentials.aws_region = this.options.Region;
          resolve(this);
        }
      });
    });
  }
}

/**
 * MQTT client to be used by web client to subscribe to topics and to publish messages. Handles all connections through Cognito Identity pool
 */
class MQTTClient {
  connection: mqtt.MqttClientConnection = {} as mqtt.MqttClientConnection;
  isConnected: boolean = false;
  private connect_websocket: any = (provider: auth.CredentialsProvider) => {
    return new Promise<mqtt.MqttClientConnection>((resolve, reject) => {
      console.log("Connecting to IOT Core with client id:" + clientId);
      let config =
        iot.AwsIotMqttConnectionConfigBuilder.new_builder_for_websocket()
          .with_clean_session(true)
          .with_client_id(clientId)
          .with_endpoint(process.env.REACT_APP_AWS_IOT_ENDPOINT!)
          .with_credential_provider(provider)
          .with_use_websockets()
          .with_keep_alive_seconds(30)
          .build();

      log(
        `Connecting websocket, clientId:${config.client_id}, endpoint:${process.env.REACT_APP_AWS_IOT_ENDPOINT}`
      );
      const client = new mqtt.MqttClient();

      const connection = client.new_connection(config);
      connection.on("connect", (session_present) => {
        log("connected, now resolving promise");
        resolve(connection);
      });
      connection.on("interrupt", (error) => {
        log(`Connection interrupted: error=${error}`);
      });
      connection.on("resume", (return_code, session_present) => {
        log(`Resumed: rc: ${return_code} existing session: ${session_present}`);
      });
      connection.on("disconnect", () => {
        log("Disconnected");
      });
      connection.on("error", (error) => {
        log(`Error: ${error}`);
        console.log(error);
        reject(error);
      });
      connection.connect();
    });
  };

  /**
   * Subscribes to the topic and callback function is executed when message arrives
   * @param topic Topic to subscribe to
   * @param callback Function with one argument to be called when message arrives
   */
  subscribe = async (topic: string, callback: any) => {
    if (!this.isConnected) {
      this.connect().then(() => {
        this.subscribeWithConnection(this.connection, topic, callback);
      });
    } else {
      this.subscribeWithConnection(this.connection, topic, callback);
    }
  };

  connect = async () => {
    if (!this.isConnected) {
      const provider = new AWSCognitoCredentialsProvider({
        IdentityPoolId: process.env.REACT_APP_AWS_COGNITO_IDENTITY_POOL_ID!,
        Region: process.env.REACT_APP_AWS_REGION!,
      });
      /** Make sure the credential provider fetched before setup the connection */
      await provider.refreshCredentialAsync();
      try {
        this.connection = await this.connect_websocket(provider);
        this.isConnected = true;
      } catch (reason: any) {
        throw new Error(`Error while connecting: ${reason}`);
      }
    }
  };

  /**
   * Unsubscribes from the topic
   * @param topic
   */
  unsubscribe = (topic: string) => {
    console.log("Unsubscribing from topic: " + topic);
    this.connection?.unsubscribe(topic);
  };

  /**
   * Unsubscribes from the topic
   * @param topic
   */
  publish = async (topic: string, message: string) => {
    console.log("Publishing to topic: " + topic);
    if (!this.isConnected) {
      await this.connect();
      this.connection?.publish(topic, message, mqtt.QoS.AtLeastOnce);
    } else {
      this.connection?.publish(topic, message, mqtt.QoS.AtLeastOnce);
    }
  };

  disconnect = () => {
    console.log("Disconnecting from MQTT connection");
    this.connection?.disconnect();
    this.isConnected = false;
  };

  private subscribeWithConnection = (
    connection: mqtt.MqttClientConnection,
    topic: string,
    callback: any
  ) => {
    console.log("Subscribing to MQTT topic: " + topic);
    connection.subscribe(
      topic,
      mqtt.QoS.AtLeastOnce,
      (topic, payload, dup, qos, retain) => {
        const decoder = new TextDecoder("utf8");
        let message = decoder.decode(new Uint8Array(payload));
        log(`Message received: topic=${topic} message=${message}`);
        callback(message);
      }
    );
  };
}
export const mqttClient = new MQTTClient();
