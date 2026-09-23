import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import DocTypes "../types/document";
import IC "ic:aaaaa-aa";

/// Public API mixin for the Document Vault domain (Tier 2+).
/// Drivers can upload, annotate, and soft-delete documents (vehicle registration,
/// licence, invoices, other). storageRef is set by the frontend after a direct
/// object-storage upload — the backend stores only the key + metadata.
/// Nduna can query documents by type via queryDocumentsByType().
mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles           : Map.Map<Principal, {
    displayName      : Text;
    currencyCode     : Text;
    subscriptionTier : Nat;
    voiceEnabled     : Bool;
    fuelConsumptionRate : Float;
    vehicleName      : Text;
  }>,
  /// Primary document store: docId → DocumentRecord
  documentsMap       : Map.Map<Text, DocTypes.DocumentRecord>,
  /// Secondary index: driverId (Text) → list of docIds owned by that driver
  driverDocIndex     : Map.Map<Text, List.List<Text>>,
  /// Config flag: whether driver notes are enabled (admin-controlled)
  docVaultNotesEnabled : { var value : Bool },
  /// VPS URL for Hyperframes/Markit conversion endpoint (may be empty if not configured)
  vpsUrl             : { var value : Text },
  /// VPS API key for authenticating requests to the VPS
  vpsApiKey          : { var value : Text },
) {

  // ── Upload ─────────────────────────────────────────────────────────────────

  /// Upload (register) a document for the calling driver.
  /// Returns the new document ID on success.
  /// Requires Tier 2+ subscription.
  public shared ({ caller }) func uploadDocument(
    storageRef : Text,
    docType    : DocTypes.DocumentType,
    fileName   : Text,
    notes      : Text,
  ) : async { #ok : Text; #err : Text } {
    // Capture caller before any await
    let capturedCaller = caller;

    if (not AccessControl.hasPermission(accessControlState, capturedCaller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };
    let profile = switch (profiles.get(capturedCaller)) {
      case (null) { return #err("Profile not found — create your profile first") };
      case (?p)   { p };
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, capturedCaller);
    if (not isAdmin and profile.subscriptionTier < 2) {
      return #err("Document Vault requires Tier 2 or higher subscription.");
    };
    if (storageRef.size() == 0) {
      return #err("storageRef cannot be empty");
    };
    if (fileName.size() == 0) {
      return #err("fileName cannot be empty");
    };

    let now = Time.now();
    let driverId = capturedCaller.toText();
    let docId = driverId # "-" # now.toText();

    let record : DocTypes.DocumentRecord = {
      id              = docId;
      driverId        = driverId;
      uploadedAt      = now;
      storageRef      = storageRef;
      docType         = docType;
      fileName        = fileName;
      notes           = notes;
      deleted         = false;
      markdownContent = null;
      markdownStatus  = null;
    };

    documentsMap.add(docId, record);

    // Update driver secondary index
    let existingIds = switch (driverDocIndex.get(driverId)) {
      case (null) { List.empty<Text>() };
      case (?ids) { ids };
    };
    existingIds.add(docId);
    driverDocIndex.add(driverId, existingIds);

    #ok(docId);
  };

  // ── List ───────────────────────────────────────────────────────────────────

  /// Return all non-deleted documents for the calling driver, most recent first.
  /// Requires Tier 2+ subscription.
  public query ({ caller }) func listDriverDocuments() : async [DocTypes.DocumentRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let profile = switch (profiles.get(caller)) {
      case (null) { return [] };
      case (?p)   { p };
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    if (not isAdmin and profile.subscriptionTier < 2) {
      return [];
    };

    let driverId = caller.toText();
    let docIds = switch (driverDocIndex.get(driverId)) {
      case (null) { return [] };
      case (?ids) { ids.toArray() };
    };

    let result = List.empty<DocTypes.DocumentRecord>();
    for (docId in docIds.values()) {
      switch (documentsMap.get(docId)) {
        case (null)  {};
        case (?doc)  {
          if (not doc.deleted) {
            result.add(doc);
          };
        };
      };
    };

    // Sort by uploadedAt descending (most recent first)
    result.toArray().sort(func(a, b) {
      Int.compare(b.uploadedAt, a.uploadedAt)
    });
  };

  // ── Delete (soft) ──────────────────────────────────────────────────────────

  /// Soft-delete a document owned by the calling driver.
  /// Returns #ok(true) on success, #err with reason on failure.
  public shared ({ caller }) func deleteDocument(docId : Text) : async { #ok : Bool; #err : Text } {
    let capturedCaller = caller;

    if (not AccessControl.hasPermission(accessControlState, capturedCaller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };
    let profile = switch (profiles.get(capturedCaller)) {
      case (null) { return #err("Profile not found") };
      case (?p)   { p };
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, capturedCaller);
    if (not isAdmin and profile.subscriptionTier < 2) {
      return #err("Document Vault requires Tier 2 or higher subscription.");
    };

    let driverId = capturedCaller.toText();
    switch (documentsMap.get(docId)) {
      case (null)  { #err("Document not found: " # docId) };
      case (?doc) {
        if (doc.driverId != driverId and not isAdmin) {
          return #err("Unauthorized: Document belongs to a different driver");
        };
        documentsMap.add(docId, { doc with deleted = true });
        #ok(true);
      };
    };
  };

  // ── Notes ─────────────────────────────────────────────────────────────────

  /// Update the annotation note on a document owned by the calling driver.
  /// Returns #ok(true) on success, #err with reason on failure.
  public shared ({ caller }) func addDocumentNote(docId : Text, note : Text) : async { #ok : Bool; #err : Text } {
    let capturedCaller = caller;

    if (not AccessControl.hasPermission(accessControlState, capturedCaller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };
    let profile = switch (profiles.get(capturedCaller)) {
      case (null) { return #err("Profile not found") };
      case (?p)   { p };
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, capturedCaller);
    if (not isAdmin and profile.subscriptionTier < 2) {
      return #err("Document Vault requires Tier 2 or higher subscription.");
    };

    let driverId = capturedCaller.toText();
    switch (documentsMap.get(docId)) {
      case (null)  { #err("Document not found: " # docId) };
      case (?doc) {
        if (doc.driverId != driverId and not isAdmin) {
          return #err("Unauthorized: Document belongs to a different driver");
        };
        if (doc.deleted) {
          return #err("Cannot annotate a deleted document");
        };
        documentsMap.add(docId, { doc with notes = note });
        #ok(true);
      };
    };
  };

  // ── Nduna query ───────────────────────────────────────────────────────────

  /// Query non-deleted documents by type for the calling driver.
  /// Called by Nduna to surface relevant documents (e.g. "show my licences").
  /// Requires Tier 2+ subscription.
  public query ({ caller }) func queryDocumentsByType(docType : Text) : async [DocTypes.DocumentRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    let profile = switch (profiles.get(caller)) {
      case (null) { return [] };
      case (?p)   { p };
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    if (not isAdmin and profile.subscriptionTier < 2) {
      return [];
    };

    let driverId = caller.toText();
    let docIds = switch (driverDocIndex.get(driverId)) {
      case (null) { return [] };
      case (?ids) { ids.toArray() };
    };

    let docTypeLower = docType.toLower();
    let result = List.empty<DocTypes.DocumentRecord>();
    for (docId in docIds.values()) {
      switch (documentsMap.get(docId)) {
        case (null)  {};
        case (?doc)  {
          if (not doc.deleted) {
            // Match by docType text — check both variant name and human label
            let typeMatch = switch (doc.docType) {
              case (#registration)  { "registration".contains(#text docTypeLower) or docTypeLower.contains(#text "registration") or docTypeLower.contains(#text "reg") };
              case (#licence)       { "licence".contains(#text docTypeLower) or docTypeLower.contains(#text "licence") or docTypeLower.contains(#text "license") or docTypeLower.contains(#text "prdp") };
              case (#invoice)       { "invoice".contains(#text docTypeLower) or docTypeLower.contains(#text "invoice") or docTypeLower.contains(#text "receipt") };
              case (#other)         { docTypeLower.contains(#text "other") or docTypeLower == "" };
            };
            if (typeMatch) {
              result.add(doc);
            };
          };
        };
      };
    };
    result.toArray();
  };

  // ── Admin list-all ────────────────────────────────────────────────────────

  /// Admin only: return all non-deleted document records across all drivers.
  public query ({ caller }) func adminListAllDocuments() : async [DocTypes.DocumentRecord] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can list all documents");
    };
    let result = List.empty<DocTypes.DocumentRecord>();
    for ((_, doc) in documentsMap.entries()) {
      if (not doc.deleted) {
        result.add(doc);
      };
    };
    result.toArray();
  };

  // ── Config ────────────────────────────────────────────────────────────────

  /// Return current document vault configuration (any authenticated user).
  public query ({ caller }) func getDocVaultConfig() : async { notesEnabled : Bool } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    { notesEnabled = docVaultNotesEnabled.value };
  };

  /// Admin only: enable or disable driver notes on documents.
  public shared ({ caller }) func setDocVaultNotesEnabled(enabled : Bool) : async { #ok : Bool; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins can change document vault config");
    };
    docVaultNotesEnabled.value := enabled;
    #ok(true);
  };

  // ── Markit / Markdown conversion ──────────────────────────────────────────

  /// Request Markdown conversion for a document the calling driver owns.
  /// Sets markdownStatus to #pending and fires an HTTP outcall to the VPS /markit/convert
  /// endpoint. The VPS fetches the file, runs markit-style conversion, and calls back
  /// via updateMarkdownContent() with the result.
  /// Returns #ok(()) immediately — conversion is asynchronous.
  public shared ({ caller }) func requestMarkdownConversion(storageRef : Text) : async { #ok : (); #err : Text } {
    let capturedCaller = caller;

    if (not AccessControl.hasPermission(accessControlState, capturedCaller, #user)) {
      return #err("Unauthorized: Must be logged in");
    };
    let profile = switch (profiles.get(capturedCaller)) {
      case (null) { return #err("Profile not found") };
      case (?p)   { p };
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, capturedCaller);
    if (not isAdmin and profile.subscriptionTier < 2) {
      return #err("Document Vault requires Tier 2 or higher subscription.");
    };

    let driverId = capturedCaller.toText();

    // Find the document by storageRef — caller must own it
    var foundDoc : ?DocTypes.DocumentRecord = null;
    switch (driverDocIndex.get(driverId)) {
      case (null) { return #err("No documents found for this driver") };
      case (?ids) {
        for (docId in ids.toArray().values()) {
          switch (documentsMap.get(docId)) {
            case (null)  {};
            case (?doc)  {
              if (doc.storageRef == storageRef and not doc.deleted) {
                foundDoc := ?doc;
              };
            };
          };
        };
      };
    };

    let doc = switch (foundDoc) {
      case (null) { return #err("Document not found or access denied") };
      case (?d)   { d };
    };

    // Set status to #pending immediately
    documentsMap.add(doc.id, { doc with
      markdownStatus  = ?(#pending);
      markdownContent = null;
    });

    // Determine file type hint from extension
    let lowerName = doc.fileName.toLower();
    let fileType = if (lowerName.endsWith(#text ".pdf")) {
      "pdf"
    } else if (lowerName.endsWith(#text ".docx") or lowerName.endsWith(#text ".doc")) {
      "docx"
    } else if (lowerName.endsWith(#text ".xlsx") or lowerName.endsWith(#text ".xls")) {
      "xlsx"
    } else if (lowerName.endsWith(#text ".pptx") or lowerName.endsWith(#text ".ppt")) {
      "pptx"
    } else {
      "other"
    };

    let vpsEndpoint = vpsUrl.value;
    if (vpsEndpoint == "") {
      // VPS not configured — mark as failed gracefully
      documentsMap.add(doc.id, { doc with
        markdownStatus  = ?(#failed);
        markdownContent = null;
      });
      return #err("VPS not configured — cannot convert document");
    };

    // Escape helper for JSON string values
    let escStorageRef = escapeJsonValue(storageRef);
    let escDriverId   = escapeJsonValue(driverId);
    let escFileType   = escapeJsonValue(fileType);
    let requestBody =
      "{\"storageRef\":\"" # escStorageRef # "\"," #
      "\"driverId\":\"" # escDriverId # "\"," #
      "\"fileType\":\"" # escFileType # "\"}";

    let httpRequest : IC.http_request_args = {
      url                = vpsEndpoint # "/markit/convert";
      max_response_bytes = ?8_000;
      headers            = [
        { name = "Content-Type"; value = "application/json" },
        { name = "X-API-Key";    value = vpsApiKey.value },
        { name = "User-Agent";   value = "MoneyDrive/1.0" },
      ];
      body               = ?requestBody.encodeUtf8();
      method             = #post;
      transform          = null;
      is_replicated      = ?false;
    };

    let _response = try {
      await (with cycles = 50_000_000_000) IC.http_request(httpRequest);
    } catch (_e) {
      // Fire-and-forget — VPS will callback via updateMarkdownContent.
      // If the initial request fails, mark as failed so UI can retry.
      documentsMap.add(doc.id, { doc with
        markdownStatus  = ?(#failed);
        markdownContent = null;
      });
      return #err("VPS request failed — conversion will need to be retried");
    };

    // Status remains #pending — VPS will callback asynchronously
    #ok(());
  };

  /// Admin/VPS callback — only callable by admin principal.
  /// Called by the VPS when it has finished (or failed) converting a document.
  /// Updates markdownContent and markdownStatus on the matching document.
  public shared ({ caller }) func updateMarkdownContent(
    storageRef : Text,
    content    : ?Text,
    status     : DocTypes.MarkdownStatus,
  ) : async { #ok : (); #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: Only admins or VPS callback can update markdown content");
    };

    // Find document by storageRef across all drivers
    var foundDoc : ?DocTypes.DocumentRecord = null;
    for ((_, doc) in documentsMap.entries()) {
      if (doc.storageRef == storageRef and not doc.deleted) {
        foundDoc := ?doc;
      };
    };

    switch (foundDoc) {
      case (null) { #err("Document not found for storageRef: " # storageRef) };
      case (?doc) {
        let resolvedStatus : DocTypes.MarkdownStatus = switch (content) {
          case (?_) { #ready };
          case (null) { status };
        };
        documentsMap.add(doc.id, { doc with
          markdownContent = content;
          markdownStatus  = ?resolvedStatus;
        });
        #ok(());
      };
    };
  };

  /// Driver-owned query — caller isolation (owner or admin).
  /// Returns the Markdown content for a document if conversion is complete.
  public query ({ caller }) func getDocumentMarkdown(storageRef : Text) : async { #ok : Text; #err : Text } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be logged in");
    };

    let driverId = caller.toText();
    let isAdmin  = AccessControl.isAdmin(accessControlState, caller);

    // Find document by storageRef
    var foundDoc : ?DocTypes.DocumentRecord = null;
    for ((_, doc) in documentsMap.entries()) {
      if (doc.storageRef == storageRef and not doc.deleted) {
        // Enforce owner or admin isolation
        if (doc.driverId == driverId or isAdmin) {
          foundDoc := ?doc;
        };
      };
    };

    switch (foundDoc) {
      case (null) { #err("not_found") };
      case (?doc) {
        switch (doc.markdownStatus) {
          case (null)           { #err("not_ready") };
          case (?(#pending))    { #err("not_ready") };
          case (?(#converting)) { #err("not_ready") };
          case (?(#failed))     { #err("failed") };
          case (?(#unsupported)) { #err("unsupported") };
          case (?(#ready)) {
            switch (doc.markdownContent) {
              case (null)    { #err("failed") };
              case (?content) { #ok(content) };
            };
          };
        };
      };
    };
  };

  // ── Private helpers ────────────────────────────────────────────────────────

  /// Escape a Text value for safe inclusion in a JSON string literal.
  private func escapeJsonValue(s : Text) : Text {
    var result = "";
    for (c in s.toIter()) {
      let code = c.toNat32();
      if (code == 34) { result := result # "\\\"" }
      else if (code == 92) { result := result # "\\\\" }
      else if (code == 10) { result := result # "\\n" }
      else if (code == 13) { result := result # "\\r" }
      else if (code == 9)  { result := result # "\\t" }
      else { result := result # Text.fromChar(c) };
    };
    result;
  };
};
