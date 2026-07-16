const mapGrievanceToResponse = (g) => {
  const isAnon = !!g.anonymous;
  return {
    id: g.id,
    title: g.title,
    description: g.description,
    category: g.category || 'OTHER',
    status: g.status || 'OPEN',
    anonymous: isAnon,
    submittedBy: isAnon ? 'Anonymous' : (g.createdBy ? g.createdBy.fullName : 'Unknown'),
    studentName: g.studentName,
    proofFileName: g.proofFileName,
    proofFilePath: g.proofFilePath,
    departmentName: g.department ? g.department.departmentName : null,
    priority: g.priority || 'MEDIUM',
    createdAt: g.createdAt,
    updatedAt: g.updatedAt
  };
};

const mapNotificationToResponse = (n) => ({
  id: n.id,
  message: n.message,
  isRead: n.isRead,
  createdAt: n.createdAt,
  grievanceId: n.grievance ? n.grievance.id : null
});

const mapCommentToResponse = (c) => ({
  id: c.id,
  commentText: c.commentText,
  senderName: c.sender ? c.sender.fullName : 'Unknown',
  senderRole: c.sender && c.sender.role ? c.sender.role.roleName : 'UNKNOWN',
  createdAt: c.createdAt
});

const mapHistoryToResponse = (h) => ({
  oldStatus: h.oldStatus,
  newStatus: h.newStatus,
  remarks: h.remarks,
  changedBy: h.changedBy ? h.changedBy.fullName : 'System Escalation',
  changedAt: h.changedAt
});

module.exports = {
  mapGrievanceToResponse,
  mapNotificationToResponse,
  mapCommentToResponse,
  mapHistoryToResponse
};
