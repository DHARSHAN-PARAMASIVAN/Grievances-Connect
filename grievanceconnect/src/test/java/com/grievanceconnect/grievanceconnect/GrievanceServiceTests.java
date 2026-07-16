package com.grievanceconnect.grievanceconnect;

import com.grievanceconnect.grievanceconnect.dto.request.CreateGrievanceRequest;
import com.grievanceconnect.grievanceconnect.dto.request.GrievanceCommentRequest;
import com.grievanceconnect.grievanceconnect.dto.response.AdminAnalyticsResponse;
import com.grievanceconnect.grievanceconnect.dto.response.GrievanceCommentResponse;
import com.grievanceconnect.grievanceconnect.dto.response.GrievanceResponse;
import com.grievanceconnect.grievanceconnect.entity.*;
import com.grievanceconnect.grievanceconnect.enums.GrievanceCategory;
import com.grievanceconnect.grievanceconnect.enums.GrievancePriority;
import com.grievanceconnect.grievanceconnect.enums.GrievanceStatus;
import com.grievanceconnect.grievanceconnect.repository.*;
import com.grievanceconnect.grievanceconnect.service.EmailService;
import com.grievanceconnect.grievanceconnect.service.impl.GrievanceServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GrievanceServiceTests {

    @Mock
    private GrievanceRepository grievanceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GrievanceHistoryRepository grievanceHistoryRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private GrievanceCommentRepository grievanceCommentRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private GrievanceServiceImpl grievanceService;

    private User student;
    private User staff;
    private Department department;
    private Role studentRole;
    private Role staffRole;

    @BeforeEach
    void setUp() {
        department = Department.builder()
                .id(1L)
                .departmentName("Computer Science")
                .departmentCode("CSE")
                .build();

        studentRole = Role.builder().id(1L).roleName(com.grievanceconnect.grievanceconnect.enums.RoleName.STUDENT).build();
        staffRole = Role.builder().id(2L).roleName(com.grievanceconnect.grievanceconnect.enums.RoleName.STAFF).build();

        student = User.builder()
                .id(1L)
                .fullName("John Doe")
                .email("student@college.com")
                .role(studentRole)
                .department(department)
                .build();

        staff = User.builder()
                .id(2L)
                .fullName("Professor Smith")
                .email("staff@college.com")
                .role(staffRole)
                .department(department)
                .build();
    }

    @Test
    void testCreateGrievance() {
        CreateGrievanceRequest request = new CreateGrievanceRequest();
        request.setTitle("Lab Wi-Fi issue");
        request.setDescription("Wi-Fi is not working in CSE Lab 3.");
        request.setCategory("INFRASTRUCTURE");
        request.setPriority("HIGH");
        request.setAnonymous(false);
        request.setStaffId(2L);

        Grievance grievance = Grievance.builder()
                .id(100L)
                .title(request.getTitle())
                .description(request.getDescription())
                .category(GrievanceCategory.INFRASTRUCTURE)
                .status(GrievanceStatus.OPEN)
                .priority(GrievancePriority.HIGH)
                .anonymous(false)
                .createdBy(student)
                .assignedStaff(staff)
                .department(department)
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findByEmail("student@college.com")).thenReturn(Optional.of(student));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staff));
        when(grievanceRepository.save(any(Grievance.class))).thenReturn(grievance);

        GrievanceResponse response = grievanceService.createGrievance(request, "student@college.com");

        assertNotNull(response);
        assertEquals("Lab Wi-Fi issue", response.getTitle());
        assertEquals("OPEN", response.getStatus());
        assertEquals("HIGH", response.getPriority());
        assertEquals("John Doe", response.getSubmittedBy());

        verify(grievanceRepository, times(1)).save(any(Grievance.class));
        verify(emailService, times(1)).sendGrievanceSubmittedEmail(any(), any(), any(), any());
        verify(emailService, times(1)).sendStaffNotification(any(), any(), any(), any());
    }

    @Test
    void testEscalateToHod() {
        Grievance grievance = Grievance.builder()
                .id(101L)
                .title("Exam schedule clash")
                .description("Two final papers clash on Monday.")
                .category(GrievanceCategory.EXAMINATION)
                .status(GrievanceStatus.IN_PROGRESS)
                .createdBy(student)
                .department(department)
                .build();

        when(grievanceRepository.findById(101L)).thenReturn(Optional.of(grievance));
        when(userRepository.findByEmail("staff@college.com")).thenReturn(Optional.of(staff));
        when(grievanceRepository.save(any(Grievance.class))).thenAnswer(i -> i.getArguments()[0]);

        GrievanceResponse response = grievanceService.escalateToHod(101L, "staff@college.com");

        assertNotNull(response);
        assertEquals("ESCALATED_TO_HOD", response.getStatus());

        verify(grievanceRepository, times(1)).save(any(Grievance.class));
        verify(grievanceHistoryRepository, times(1)).save(any(GrievanceHistory.class));
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void testAddComment() {
        Grievance grievance = Grievance.builder()
                .id(102L)
                .title("Hostel Food quality")
                .description("Dinner quality is poor.")
                .createdBy(student)
                .assignedStaff(staff)
                .build();

        GrievanceCommentRequest request = new GrievanceCommentRequest();
        request.setCommentText("Electrician will visit tomorrow.");

        GrievanceComment comment = GrievanceComment.builder()
                .id(50L)
                .grievance(grievance)
                .sender(staff)
                .commentText(request.getCommentText())
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findByEmail("staff@college.com")).thenReturn(Optional.of(staff));
        when(grievanceRepository.findById(102L)).thenReturn(Optional.of(grievance));
        when(grievanceCommentRepository.save(any(GrievanceComment.class))).thenReturn(comment);

        GrievanceCommentResponse response = grievanceService.addComment(102L, "staff@college.com", request);

        assertNotNull(response);
        assertEquals("Electrician will visit tomorrow.", response.getCommentText());
        assertEquals("Professor Smith", response.getSenderName());
        assertEquals("STAFF", response.getSenderRole());

        verify(grievanceCommentRepository, times(1)).save(any(GrievanceComment.class));
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void testGetAdminAnalytics() {
        List<Grievance> grievances = new ArrayList<>();
        grievances.add(Grievance.builder()
                .category(GrievanceCategory.ACADEMIC)
                .status(GrievanceStatus.RESOLVED)
                .department(department)
                .createdAt(LocalDateTime.now().minusDays(1))
                .updatedAt(LocalDateTime.now())
                .build());
        grievances.add(Grievance.builder()
                .category(GrievanceCategory.HOSTEL)
                .status(GrievanceStatus.OPEN)
                .department(department)
                .createdAt(LocalDateTime.now())
                .build());

        when(grievanceRepository.findAll()).thenReturn(grievances);

        AdminAnalyticsResponse analytics = grievanceService.getAdminAnalytics();

        assertNotNull(analytics);
        assertEquals(50.0, analytics.getResolutionPercentage());
        assertEquals(1, analytics.getCategoryWiseComplaints().get("ACADEMIC"));
        assertEquals(1, analytics.getCategoryWiseComplaints().get("HOSTEL"));
        assertEquals(2, analytics.getDepartmentWiseComplaints().get("Computer Science"));
    }
}
