package com.dongledungle.catching.history.controller;

import com.dongledungle.catching.history.dto.HistoryDto;
import com.dongledungle.catching.history.service.HistoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;


import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("HistoryController 테스트")
class HistoryControllerTest {
    @Mock
    private HistoryService historyService;

    @InjectMocks
    private HistoryController historyController;

    @Mock
    private Authentication authentication;
    private List<HistoryDto> mockHistoryList;

    @BeforeEach
    void setUp() {
        // Mock Authentication 설정
        when(authentication.getPrincipal()).thenReturn("1");

        // Mock 데이터 설정
        mockHistoryList = List.of(
                HistoryDto.builder()
                        .historyId(1L)
                        .companyPositionId(100L)
                        .company("현대오토에버")
                        .position("스마트팩토리")
                        .createdAt(LocalDateTime.now())
                        .build(),
                HistoryDto.builder()
                        .historyId(2L)
                        .companyPositionId(200L)
                        .company("신한은행")
                        .position("IT 플랫폼 개발")
                        .createdAt(LocalDateTime.now().minusDays(7))
                        .build()
        );
    }

    @Test
    @DisplayName("히스토리 목록 조회 성공")
    void getHistoryList_Success() {
        // given
        when(historyService.getHistory(1L)).thenReturn(mockHistoryList);

        // when
        var response = historyController.getHistoryList(authentication);

        // then
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getMessage()).isEqualTo("유저의 최근 한 달 History");
        assertThat(response.getBody().getData()).hasSize(2);
        assertThat(response.getBody().getData().get(0).getCompany()).isEqualTo("현대오토에버");

        verify(historyService, times(1)).getHistory(1L);
    }

    @Test
    @DisplayName("히스토리가 없는 경우 빈 리스트 반환")
    void getHistoryList_EmptyList() {
        // given
        when(historyService.getHistory(1L)).thenReturn(List.of());

        // when
        var response = historyController.getHistoryList(authentication);

        // then
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).isEmpty();

        verify(historyService, times(1)).getHistory(1L);
    }

    @Test
    @DisplayName("서비스 예외 발생 시 예외 전파")
    void getHistoryList_ServiceException() {
        // given
        when(historyService.getHistory(1L))
                .thenThrow(new RuntimeException("DB 오류"));

        // when & then
        try {
            historyController.getHistoryList(authentication);
        } catch (RuntimeException e) {
            assertThat(e.getMessage()).isEqualTo("DB 오류");
        }

        verify(historyService, times(1)).getHistory(1L);
    }

    @Test
    @DisplayName("여러 개의 히스토리 반환 검증")
    void getHistoryList_MultipleHistories() {
        // given
        List<HistoryDto> manyHistories = List.of(
                createHistoryDto(1L, "회사A", "직무A"),
                createHistoryDto(2L, "회사B", "직무B"),
                createHistoryDto(3L, "회사C", "직무C"),
                createHistoryDto(4L, "회사D", "직무D"),
                createHistoryDto(5L, "회사E", "직무E")
        );

        when(historyService.getHistory(1L)).thenReturn(manyHistories);

        // when
        var response = historyController.getHistoryList(authentication);

        // then
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).hasSize(5);
        assertThat(response.getBody().getData())
                .extracting(HistoryDto::getCompany)
                .containsExactly("회사A", "회사B", "회사C", "회사D", "회사E");
    }

    private HistoryDto createHistoryDto(Long id, String company, String position) {
        return HistoryDto.builder()
                .historyId(id)
                .companyPositionId(id * 100)
                .company(company)
                .position(position)
                .createdAt(LocalDateTime.now())
                .build();
    }
}