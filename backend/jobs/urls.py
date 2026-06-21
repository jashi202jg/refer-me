from django.urls import path
from .views import (
    JobListCreateView,
    JobDetailView,
    ApplicationListCreateView,
    ApplicationDetailView
)

urlpatterns = [
    # Job endpoints
    path('jobs/', JobListCreateView.as_view(), name='job-list-create'),
    path('jobs/<int:pk>/', JobDetailView.as_view(), name='job-detail'),
    
    # Application endpoints
    path('applications/', ApplicationListCreateView.as_view(), name='application-list-create'),
    path('applications/<int:pk>/', ApplicationDetailView.as_view(), name='application-detail'),
]
