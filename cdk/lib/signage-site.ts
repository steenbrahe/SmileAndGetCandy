import { Construct } from 'constructs';
import { SignageInfra } from './signage-infra';
import { CreateUser } from './api/create-user';
import { DetectUser } from './api/detect-user';
import { GetPlaylist } from './api/get-playlist';
import { DeleteUser } from './api/delete-user';
/**
 * High level construct to create CloudFront/ S3 / API gateway/ Lambda / CloudFront
 */
export class SignageSite extends Construct {

  private infra:SignageInfra;

  constructor(scope: Construct, id: string, infra:SignageInfra) {
    super(scope, id);
    this.infra = infra;
    
    new GetPlaylist(this,"GetPlaylistHandler", infra);
    new DetectUser(this,"DetectUserHandler", infra);
    new CreateUser(this, "CreateUserHandler", infra);
    new DeleteUser(this, "DeleteUserHandler", infra);
    
  }
}
