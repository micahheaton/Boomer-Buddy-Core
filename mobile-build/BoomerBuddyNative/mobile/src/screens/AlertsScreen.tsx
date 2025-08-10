import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { ApiService } from '../services/ApiService';

interface ScamAlert {
  source: string;
  title: string;
  link: string;
  published_at: string;
  tags: string[];
  state?: string;
  severity: string;
  elder_relevance_score: number;
}

const AlertsScreen = () => {
  const [alerts, setAlerts] = useState<ScamAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [totalSources, setTotalSources] = useState(0);

  const fetchAlerts = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await ApiService.getFeeds();
      
      if (response.success) {
        setAlerts(response.feeds);
        setLastUpdate(response.metadata.last_updated);
        setTotalSources(response.metadata.total_sources);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      Alert.alert(
        'Connection Error',
        'Unable to fetch latest alerts. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAlerts(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#16A34A';
      default: return '#6B7280';
    }
  };

  const getSeverityBadge = (severity: string) => {
    return (
      <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(severity) }]}>
        <Text style={styles.severityText}>{severity.toUpperCase()}</Text>
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const openAlert = (alert: ScamAlert) => {
    Alert.alert(
      alert.title,
      `Source: ${alert.source}\n\nThis alert was published ${formatDate(alert.published_at)}.\n\nRelevance Score: ${alert.elder_relevance_score}%`,
      [
        { text: 'Close', style: 'cancel' },
        { 
          text: 'Learn More', 
          onPress: () => {
            // TODO: Open in-app browser or navigate to details screen
            console.log('Opening:', alert.link);
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading latest alerts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scam Alerts</Text>
        <Text style={styles.headerSubtitle}>
          {totalSources} Government Sources • Updated {formatDate(lastUpdate)}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAlerts(true)}
            tintColor="#17948E"
            colors={['#17948E']}
          />
        }
      >
        {alerts.length === 0 ? (
          <View style={styles.noAlertsContainer}>
            <Text style={styles.noAlertsText}>No active alerts at this time</Text>
            <Text style={styles.noAlertsSubtext}>
              Great news! No major scam threats are currently detected.
            </Text>
          </View>
        ) : (
          alerts.map((alert, index) => (
            <TouchableOpacity
              key={`${alert.source}-${index}`}
              style={styles.alertCard}
              onPress={() => openAlert(alert)}
            >
              <View style={styles.alertHeader}>
                {getSeverityBadge(alert.severity)}
                <Text style={styles.sourceText}>{alert.source}</Text>
              </View>
              
              <Text style={styles.alertTitle}>{alert.title}</Text>
              
              <View style={styles.alertFooter}>
                <Text style={styles.timeText}>{formatDate(alert.published_at)}</Text>
                <Text style={styles.relevanceText}>
                  {alert.elder_relevance_score}% relevant
                </Text>
              </View>
              
              {alert.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {alert.tags.slice(0, 3).map((tag, tagIndex) => (
                    <View key={tagIndex} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  noAlertsContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noAlertsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16A34A',
    textAlign: 'center',
    marginBottom: 8,
  },
  noAlertsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sourceText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 22,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  relevanceText: {
    fontSize: 12,
    color: '#17948E',
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginTop: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#374151',
  },
});

export default AlertsScreen;