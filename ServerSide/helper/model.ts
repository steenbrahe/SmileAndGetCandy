export interface User{
    email : string;
    fullname: string;
    interest: string;
    faceid:string;
    created:string;
    updated:string;
}
export interface Playlist{
    title:String;                
    description:string;
    content: Array<Content>;
}
export interface Content{
    type:string;
    imageUrl:string;
}
export interface Screen{
    id: string,
    userid:string,
    smiling:boolean,
    beard:boolean,
    glasses:boolean,
    minAge:number,
    maxAge:number,
}