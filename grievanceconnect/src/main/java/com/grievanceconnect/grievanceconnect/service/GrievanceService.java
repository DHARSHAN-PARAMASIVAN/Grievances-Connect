package com.grievanceconnect.grievanceconnect.service;
import com.grievanceconnect.grievanceconnect.dto.response.GrievanceHistoryResponse;
import com.grievanceconnect.grievanceconnect.dto.request.CreateGrievanceRequest;
import com.grievanceconnect.grievanceconnect.dto.response.GrievanceResponse;
import com.grievanceconnect.grievanceconnect.dto.response.GrievanceHistoryResponse;
import com.grievanceconnect.grievanceconnect.dto.request.GrievanceCommentRequest;
import com.grievanceconnect.grievanceconnect.dto.response.GrievanceCommentResponse;
import com.grievanceconnect.grievanceconnect.dto.response.AdminAnalyticsResponse;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import com.grievanceconnect.grievanceconnect.dto.response.NotificationResponse;

public interface GrievanceService {

    GrievanceResponse createGrievance(
            CreateGrievanceRequest request,
            String studentEmail
    );

    List<GrievanceResponse> getMyGrievances(
            String studentEmail
    );
    List<GrievanceHistoryResponse> getGrievanceHistory(Long grievanceId);
    List<GrievanceResponse> getDepartmentGrievances(String staffEmail);
    List<NotificationResponse> getNotifications(String email);
    List<GrievanceResponse> getAllGrievances();
    void markNotificationAsRead(Long notificationId, String email);
    GrievanceResponse markInProgress(Long grievanceId, String staffEmail);

    GrievanceResponse resolveGrievance(Long grievanceId, String staffEmail);

    GrievanceResponse escalateToHod(Long grievanceId, String staffEmail);

    GrievanceResponse getGrievanceById(Long id, String studentEmail);
    List<GrievanceResponse> getHodGrievances(String hodEmail);

    GrievanceResponse resolveByHod(Long grievanceId, String hodEmail);

    GrievanceResponse escalateToPrincipal(Long grievanceId, String hodEmail);
    List<GrievanceResponse> getPrincipalGrievances(String principalEmail);

    GrievanceResponse resolveByPrincipal(Long grievanceId, String principalEmail);

    GrievanceResponse closeByPrincipal(Long grievanceId, String principalEmail);
    GrievanceResponse createGrievanceWithFile(
            String title,
            String description,
            String category,
            Boolean anonymous,
            String studentName,
            MultipartFile proofFile,
            Long staffId,
            String priority,
            String studentEmail
    ) throws IOException;

    // Added comments and analytics features
    List<GrievanceCommentResponse> getComments(Long grievanceId, String userEmail);
    GrievanceCommentResponse addComment(Long grievanceId, String userEmail, GrievanceCommentRequest request);
    AdminAnalyticsResponse getAdminAnalytics();
}