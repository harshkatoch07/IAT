import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { getApprovalTrail } from "../../api/approvalsApi";
import { http, authHeaders } from "../../api/http";
import InitiateForm from "../forms/InitiateForm";

// Allowed tabs and their handlers
const ALLOWED_TABS = ["initiated", "sentback", "assigned", "approved"];

export default function ResubmitPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const approvalId = search.get('approvalId');
  const [trail, setTrail] = useState(null);
  const [openPath, setOpenPath] = useState(false);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get the effective tab from URL or default
  const effectiveTab = useMemo(() => {
    const tabFromUrl = search.get("tab");
    return ALLOWED_TABS.includes(tabFromUrl) ? tabFromUrl : "assigned";
  }, [search]);

  // Add debugging for trail data
  useEffect(() => {
    let alive = true;
    setTrail(null);
    getApprovalTrail(id)
      .then((t) => {
        console.log('Trail Data:', t); // Debug trail data
        if (alive) setTrail(t);
      })
      .catch((error) => {
        console.error('Trail Error:', error);
        if (alive) setTrail(null);
      });
    return () => { alive = false; };
  }, [id]);

  // Fetch form data
  useEffect(() => {
    let alive = true;
    const fetchFormData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await http.get(`    api.get(`/api/approvals/${approvalId}/form-snapshot`)`, {
          headers: authHeaders(),
        });
        console.log('Form Data:', response.data);
        if (alive) setFormData(response.data);
      } catch (error) {
        console.error('Form Data Error:', error);
        if (alive) {
          setError(error.response?.data || 'Failed to load form data');
          setFormData(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    
    if (id) fetchFormData();
    return () => { alive = false; };
  }, [id]);

  // Update viewKey to include formData dependency
  const viewKey = useMemo(() => 
    `${id}:${effectiveTab}:${formData ? 'loaded' : 'loading'}`,
    [id, effectiveTab, formData]
  );

  // Show loading state
  if (loading && !error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3, color: 'error.main' }}>
        {error}
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1600, mx: "auto" }}>
      {/* ...existing ApprovalPathDialog... */}

      <React.Fragment key={viewKey}>
        <InitiateForm
          key={viewKey}
          disabled={effectiveTab === 'assigned' || effectiveTab === 'approved'}
          hideActions={effectiveTab !== 'assigned'}
          mode={effectiveTab === 'assigned' ? "approver" : "initiator"}
          showButtons={
            effectiveTab === 'assigned'
              ? { approve: true, sentBack: true, reject: true, approveWithModification: true }
              : {}
          }
          tabKey={effectiveTab}
          requestId={id}
          formData={formData}
          onCancel={() => navigate(`/approvals?tab=${effectiveTab}`)}
          onUpdate={() => navigate(`/approvals?tab=${effectiveTab}`)}
          showPathButton
          onOpenPath={() => setOpenPath(true)}
        />
      </React.Fragment>
    </Box>
  );
}