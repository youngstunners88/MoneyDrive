/// Migration module for MoneyDrive backend.
/// Handles upgrade from the version where DocumentRecord lacked markdownContent
/// and markdownStatus fields.
import Map "mo:core/Map";
import DocTypes "types/document";

module {
  // ─── Old type definitions (inline — do NOT import from .old/) ────────────────

  type OldDocumentType = {
    #registration;
    #licence;
    #invoice;
    #other;
  };

  type OldDocumentRecord = {
    id          : Text;
    driverId    : Text;
    uploadedAt  : Int;
    storageRef  : Text;
    docType     : OldDocumentType;
    fileName    : Text;
    notes       : Text;
    deleted     : Bool;
  };

  // ─── Actor state shapes ───────────────────────────────────────────────────────

  type OldActor = {
    documentsMap : Map.Map<Text, OldDocumentRecord>;
  };

  type NewActor = {
    documentsMap : Map.Map<Text, DocTypes.DocumentRecord>;
  };

  // ─── Migration function ───────────────────────────────────────────────────────

  public func run(old : OldActor) : NewActor {
    let newDocumentsMap = old.documentsMap.map<Text, OldDocumentRecord, DocTypes.DocumentRecord>(
      func(_id, oldDoc) {
        {
          oldDoc with
          markdownContent = null : ?Text;
          markdownStatus  = null : ?DocTypes.MarkdownStatus;
        }
      }
    );
    { documentsMap = newDocumentsMap }
  };
};
