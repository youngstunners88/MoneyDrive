module {
  /// A South African event fetched from external sources via HTTP outcall.
  public type FetchedEvent = {
    id : Text;
    title : Text;
    date : Text;
    venue : Text;
    city : Text;
    category : Text;
    driverRelevance : Text;
    fetchedAt : Int;
    isNew : Bool;
  };
};
