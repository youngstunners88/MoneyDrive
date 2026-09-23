module {
  /// Document category — the type of file a driver has uploaded.
  public type DocumentType = {
    #registration;  // Vehicle registration / licence disc
    #licence;       // Driver's licence or Professional Driving Permit (PrDP)
    #invoice;       // Business invoice or receipt
    #other;         // Any other document
  };

  /// Conversion status of Markdown extraction for a document.
  public type MarkdownStatus = {
    #pending;      // queued for conversion
    #converting;   // VPS is processing
    #ready;        // markdownContent is populated
    #failed;       // conversion failed — markdownContent is null
    #unsupported;  // file type not convertible (e.g. image-only PDF)
  };

  /// A single document record stored for a driver.
  /// storageRef is the object-storage key — the frontend uploads directly; the backend
  /// receives the key and metadata only. Deleted records are soft-deleted (deleted = true).
  public type DocumentRecord = {
    id              : Text;
    driverId        : Text;
    uploadedAt      : Int;        // Time.now() nanoseconds
    storageRef      : Text;       // Object-storage key — never a public URL
    docType         : DocumentType;
    fileName        : Text;
    notes           : Text;       // Driver annotation or Nduna note
    deleted         : Bool;       // Soft-delete flag — never physically removed
    markdownContent : ?Text;      // Extracted and converted Markdown content
    markdownStatus  : ?MarkdownStatus;  // Conversion status
  };
};
