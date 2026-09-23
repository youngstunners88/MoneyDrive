module {
  public type WebsiteJobStatus = {
    #pending;
    #generating;
    #ready;
    #failed;
  };

  public type WebsiteJob = {
    id : Text;
    driverId : Text;
    topic : Text;
    iteration : Nat;
    htmlContent : ?Text;
    status : WebsiteJobStatus;
    errorMsg : ?Text;
    createdAt : Int;
    updatedAt : Int;
    shareUrl : ?Text;
  };

  public type WebsiteBuilderConfig = {
    enabled : Bool;
    dailyLimit : Nat; // 5 per driver per day (Tier 3)
  };

  public type Result<T, E> = {
    #ok : T;
    #err : E;
  };
};
